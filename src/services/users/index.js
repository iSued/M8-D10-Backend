const express = require("express");
const passport = require("passport");
const UserModel = require("./schema");
const { authenticate, refresh } = require("../auth");
const { authorize } = require("../auth/middlewares");
const cloudinary = require("../../cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

const usersRouter = express.Router();
//MAIN ROUTES

//ROUTE FOR GETTING OWN PROFILE
usersRouter.get("/me", authorize, async (req, res, next) => {
  try {
    res.send(req.user);
  } catch (error) {
    next(error);
  }
});
//ROUTE FOR REGISTRATION
usersRouter.post("/register", async (req, res, next) => {
  try {
    const newUser = new UserModel(req.body);
    const { _id } = await newUser.save();

    res.status(201).send(_id);
  } catch (error) {
    next(error);
  }
});
//ROUTE FOR UPDATING OWN PROFILE
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
//ROUTE FOR DELETING OWN PROFILE
usersRouter.delete("/me", authorize, async (req, res, next) => {
  try {
    await req.user.deleteOne(res.send("Deleted"));
  } catch (error) {
    next(error);
  }
});
//ROUTE FOR LOGIN
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
//ROUTE FOR REFRESH TOKEN
usersRouter.get("/refreshToken", async (req, res, next) => {
  try {
    // Grab the refresh token

    console.log(req.cookies);
    const oldRefreshToken = req.cookies.refreshToken;

    // If it's ok generate new access token and new refresh token

    const { accessToken, refreshToken } = await refresh(oldRefreshToken);

    // send them back

    res.send({ accessToken, refreshToken });
  } catch (error) {
    next(error);
  }
});
//ROUTE FOR UPLOADING IMAGE
const cloudStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "WeatherApp",
  },
});

const cloudinaryMulter = multer({ storage: cloudStorage });

usersRouter.post(
  "/picture",
  authorize,
  cloudinaryMulter.single("image"),
  async (req, res, next) => {
    try {
      const updated = await UserModel.findByIdAndUpdate(
        req.user._id,
        { image: req.file.path },
        { runValidators: true, new: true }
      );
      res.status(201).send("Successfully uploaded picture.");
    } catch (error) {
      next(error);
    }
  }
);
//ROUTES FOR SPOTIFY oAuth
//Login
usersRouter.get(
  "/spotifyLogin",
  passport.authenticate("spotify", {
    scope: ["user-read-email", "user-read-private"],
    showDialog: true,
  })
);
//Redirect
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

//ROUTES FOR GOOGLE oAuth
//Login
usersRouter.get(
  "/googleLogin",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
//Redirect
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
//ROUTES FOR FACEBOOK oAuth
//Login
usersRouter.get(
  "/facebookLogin",
  passport.authenticate("facebook", { scope: ["public_profile", "email"] })
);
//Redirect
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
//SUB-ROUTES FOR FAVOURITES
//Get all favourites
usersRouter.get("/favourites/", authorize, async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.user.id);
    res.status(200).send(user.favourites);
  } catch (error) {
    console.log(error);
    next(error);
  }
});
//Add favourite
usersRouter.post("/favourites/add", authorize, async (req, res, next) => {
  try {
    const favourite = req.body;
    await UserModel.findByIdAndUpdate(
      req.user._id,
      { $push: { favourites: favourite } },
      { runValidators: true, new: true }
    );
    res.send(req.user);
  } catch (error) {
    console.log(error);
    next(error);
  }
});
//Remove Favourite
usersRouter.delete(
  "/favourites/remove/:city",
  authorize,
  async (req, res, next) => {
    try {
      const favourite = await UserModel.findByIdAndUpdate(
        req.user._id,
        {
          $pull: {
            favourites: { city: req.params.city },
          },
        },
        {
          new: true,
        }
      );
      res.send(favourite.favourites);
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
);
module.exports = usersRouter;
