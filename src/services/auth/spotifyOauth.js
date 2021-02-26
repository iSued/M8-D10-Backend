const passport = require("passport");
const SpotifyStrategy = require("passport-spotify").Strategy;
const UserModel = require("../users/schema");
const { authenticate } = require(".");

passport.use(
  "spotify",
  new SpotifyStrategy(
    {
      clientID: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      callbackURL:
        "https://mediumbackendclone.azurewebsites.net/users/spotifyRedirect",
    },
    async function (accessToken, refreshToken, expires_in, profile, next) {
      console.log(profile);
      const newUser = {
        spotifyId: profile.id,
        name: profile.displayName,
        surname: "",
        email: profile.email,
        role: "User",
        refreshTokens: [],
      };
      try {
        const user = await UserModel.findOne({ spotifyId: profile.id });

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
    /*  async (accessToken, refreshToken, expires_in, profile, done, next) => {
      const newUser = {
        spotifyId: profile.id,
        name: profile.name.givenName,
        surname: profile.name.familyName,
        email: profile.emails[0].value,
        role: "User",
        refreshTokens: [],
      };

      try {
        const user = await UserModel.findOne({ spotifyId: profile.id });

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
  ) */
  )
);

passport.serializeUser(function (user, next) {
  next(null, user);
});
