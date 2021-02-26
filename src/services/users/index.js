const express = require("express");
const passport = require("passport");
const UserModel = require("./schema");
const { authenticate, refresh } = require("../auth");
const { authorize } = require("../auth/middlewares");

const usersRouter = express.Router();
//main routes
usersRouter.get("/", authorize, authenticate, async (req, res, next) => {
  try {
    console.log(req.user);
    const users = await UserModel.find();
    res.send(users);
  } catch (error) {
    next(error);
  }
});

usersRouter.get("/me", authenticate, async (req, res, next) => {
  try {
    res.send(req.user);
  } catch (error) {
    next(error);
  }
});

usersRouter.post("/register", async (req, res, next) => {
  try {
    const newUser = new UserModel(req.body);
    const { _id } = await newUser.save();

    res.status(201).send(_id);
  } catch (error) {
    next(error);
  }
});

usersRouter.put("/me", authorize, async (req, res, next) => {
  try {
    const updates = Object.keys(req.body);
    updates.forEach((update) => (req.user[update] = req.body[update]));
    await req.user.save();
    res.send(req.user);
  } catch (error) {
    next(error);
  }
});

usersRouter.delete("/me", authorize, async (req, res, next) => {
  try {
    await req.user.deleteOne(res.send("Deleted"));
  } catch (error) {
    next(error);
  }
});

usersRouter.post("/login", async (req, res, next) => {
  try {
    //Check credentials
    const { email, password } = req.body;

    const user = await UserModel.findByCredentials(email, password);
    //Generate token
    const { accessToken, refreshToken } = await authenticate(user);

    //Send back tokens
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      path: "/",
    });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      path: "/users/refreshToken",
    });

    res.send("Ok");
  } catch (error) {
    console.log(error);
    next(error);
  }
});

usersRouter.get("/refreshToken", async (req, res, next) => {
  try {
    // Grab the refresh token

    console.log(req.cookies);
    const oldRefreshToken = req.cookies.refreshToken;

    // Verify the token

    // If it's ok generate new access token and new refresh token

    const { accessToken, refreshToken } = await refresh(oldRefreshToken);

    // send them back

    res.send({ accessToken, refreshToken });
  } catch (error) {
    next(error);
  }
});

usersRouter.get(
  "/spotifyLogin",
  passport.authenticate("spotify", {
    scope: ["user-read-email", "user-read-private"],
    showDialog: true,
  })
);

usersRouter.get(
  "/spotifyRedirect",
  passport.authenticate("spotify"),
  async (req, res, next) => {
    try {
      res.cookie("accessToken", req.user.tokens.accessToken, {
        httpOnly: true,
      });
      res.cookie("refreshToken", req.user.tokens.refreshToken, {
        httpOnly: true,
        path: "/users/refreshToken",
      });

      res.status(200).redirect("http://localhost:3000/");
    } catch (error) {
      next(error);
    }
  }
);

usersRouter.get(
  "/googleLogin",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

usersRouter.get(
  "/googleRedirect",
  passport.authenticate("google", { failureRedirect: "/login" }),
  async (req, res, next) => {
    try {
      res.cookie("accessToken", req.user.tokens.accessToken, {
        httpOnly: true,
      });
      res.cookie("refreshToken", req.user.tokens.refreshToken, {
        httpOnly: true,
        path: "/users/refreshToken",
      });

      res.status(200).redirect("http://localhost:3000/");
    } catch (error) {
      next(error);
    }
  }
);

usersRouter.get(
  "/facebookLogin",
  passport.authenticate("facebook", { scope: ["public_profile", "email"] })
);

usersRouter.get(
  "/facebookRedirect",
  passport.authenticate("facebook", { failureRedirect: "/login" }),
  async (req, res, next) => {
    try {
      res.cookie("accessToken", req.user.tokens.accessToken, {
        httpOnly: true,
      });
      res.cookie("refreshToken", req.user.tokens.refreshToken, {
        httpOnly: true,
        path: "/users/refreshToken",
      });

      res.status(200).redirect("http://localhost:3000/");
    } catch (error) {
      next(error);
    }
  }
);

usersRouter.post("/favourites/add", authorize, async (req, res, next) => {
  try {
    const favourite = req.body;
    await UserModel.findOneAndUpdate(
      { user: req.user },
      { $push: { favourites: favourite } },
      { runValidators: true, new: true }
    );
    res.send({ favourite });
  } catch (error) {
    console.log(error);
    next(error);
  }
});
module.exports = usersRouter;
