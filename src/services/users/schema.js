const { Schema, model } = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    surname: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      default:
        "https://res.cloudinary.com/dsqdewodh/image/upload/v1614369857/WeatherApp/nd9ibbfvl78b7y3p7ire.jpg",
    },
    favourites: [
      {
        type: new Schema(
          {
            city: {
              type: String,
            },
          },
          { timestamps: true }
        ),
      },
    ],
    refreshTokens: [{ token: { type: String } }],
    spotifyId: String,
    facebookId: String,
    googleId: String,
  },

  { timestamps: true }
);

UserSchema.methods.toJSON = function () {
  const user = this;
  const userObject = user.toObject();

  delete userObject.password;
  delete userObject.__v;

  return userObject;
};

UserSchema.statics.findByCredentials = async function (email, plainPW) {
  const user = await this.findOne({ email });
  if (user) {
    const isMatch = await bcrypt.compare(plainPW, user.password);
    if (isMatch) return user;
    else return null;
  } else {
    return null;
  }
};

UserSchema.pre("save", async function (next) {
  const user = this;
  const plainPW = user.password;

  if (user.isModified("password")) {
    user.password = await bcrypt.hash(plainPW, 10);
  }
  next();
});

module.exports = model("user", UserSchema);
