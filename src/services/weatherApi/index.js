const express = require("express");
const axios = require("axios");
const { authorize } = require("../auth/middlewares");

const WeatherRouter = express.Router();

WeatherRouter.get("/:city", authorize, async (req, res, next) => {
  try {
    await axios
      .get(
        `https://api.openweathermap.org/data/2.5/weather?q=${req.params.city}&appid=${process.env.WEATHER_API_KEY}`
      )
      .then((response) => res.send(response.data));
  } catch (error) {
    console.log(error);
    next(error);
  }
});

module.exports = WeatherRouter;
