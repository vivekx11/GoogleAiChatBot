/**
 * Weather Service — OpenWeatherMap API------
 */
//-
const axios = require('axios');
const logger = require('../utils/logger');

const BASE_URL = process.env.OPENWEATHER_BASE_URL || 'https://api.openweathermap.org/data/2.5';
const API_KEY = process.env.OPENWEATHER_API_KEY;

/**
 * Get current weather
 * @param {string} location - City name or 'auto' for IP-based
 * @param {string} language - 'en' | 'hi'
 */
async function getWeather(location = 'London', language = 'en') {
  try {
    if (!API_KEY) {
      return getMockWeather(location, language);
    }

    const lang = language === 'hi' ? 'hi' : 'en';
    const response = await axios.get(`${BASE_URL}/weather`, {
      params: {
        q: location === 'auto' ? 'London' : location,
        appid: API_KEY,
        units: 'metric',
        lang,
      },
      timeout: 5000,
    });

    const data = response.data;
    const temp = Math.round(data.main.temp);
    const feels = Math.round(data.main.feels_like);
    const condition = data.weather[0].description;
    const city = data.name;
    const humidity = data.main.humidity;
    const wind = Math.round(data.wind.speed * 3.6); // m/s to km/h

    const description = language === 'hi'
      ? `${city} में अभी ${temp}°C है। ${condition}। नमी ${humidity}% और हवा ${wind} km/h।`
      : `Currently ${temp}°C in ${city}. ${condition}. Humidity ${humidity}%, wind ${wind} km/h. Feels like ${feels}°C.`;

    return {
      city,
      temperature: temp,
      feelsLike: feels,
      condition,
      humidity,
      windSpeed: wind,
      icon: data.weather[0].icon,
      description,
    };
  } catch (err) {
    logger.error('Weather API error:', err.message);
    return getMockWeather(location, language);
  }
}

function getMockWeather(location, language) {
  const description = language === 'hi'
    ? `${location} में मौसम की जानकारी उपलब्ध नहीं है।`
    : `Weather data for ${location} is currently unavailable.`;
  return { city: location, temperature: null, description };
}

module.exports = { getWeather };
