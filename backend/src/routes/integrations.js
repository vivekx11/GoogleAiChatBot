/**
 * Integrations Routes
 * GET /api/integrations/weather?location=Mumbai
 * GET /api/integrations/news?category=technology
 */
// integrations
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { getWeather } = require('../services/weatherService');
const { getNews } = require('../services/newsService');

router.use(authenticate);

router.get('/weather', async (req, res, next) => {
  try {
    const location = req.query.location || 'London';
    const language = req.query.lang || req.user.language || 'en';
    const data = await getWeather(location, language);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.get('/news', async (req, res, next) => {
  try {
    const category = req.query.category || 'general';
    const language = req.query.lang || req.user.language || 'en';
    const data = await getNews(language, category);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
