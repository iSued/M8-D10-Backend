const passport = require("passport");
const FacebookStrategy = require("passport-facebook").Strategy;
const UserModel = require("../users/schema");
const { authenticate } = require(".");

passport.use(
  "facebook",
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      callbackURL:
        "https://mediumbackendclone.azurewebsites.net/users/facebookRedirect",
    },
    async function (accessToken, refreshToken, profile, next) {
      console.log(profile);
      const newUser = {
        facebookId: profile.id,
        name: profile.displayName,
        surname: "",
        email: "",
        role: "User",
        refreshTokens: [],
      };

      try {
        const user = await UserModel.findOne({ googleId: profile.id });

        if (user) {
          const tokens = await authenticate(user);
          next(null, { user, tokens });
        } else {
          const createdUser = new UserModel(newUser);
          await createdUser.save();
          const tokens = await authenticate(createdUser);
          next(null, { user: createdUser, tokens });
        }
      } catch (error) {
        next(error);
      }
    }
  )
);
passport.serializeUser(function (user, next) {
  next(null, user);
});
