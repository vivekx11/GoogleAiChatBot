/**
 * News Service — NewsAPI----
 */
//--------------------------------
const axios = require('axios');
const logger = require('../utils/logger');

const BASE_URL = process.env.NEWS_BASE_URL || 'https://newsapi.org/v2';
const API_KEY = process.env.NEWS_API_KEY;

/**
 * Get top headlines
 * @param {string} language - 'en' | 'hi'
 * @param {string} category - technology, sports, business, etc.
 */
async function getNews(language = 'en', category = 'general') {
  try {
    if (!API_KEY) {
      return getMockNews(language);
    }

    const response = await axios.get(`${BASE_URL}/top-headlines`, {
      params: {
        country: language === 'hi' ? 'in' : 'us',
        category,
        apiKey: API_KEY,
        pageSize: 5,
      },
      timeout: 5000,
    });

    const articles = response.data.articles.map(a => ({
      title: a.title,
      source: a.source.name,
      url: a.url,
      publishedAt: a.publishedAt,
    }));

    const headlines = articles.map((a, i) => `${i + 1}. ${a.title}`).join('\n');
    const summary = language === 'hi'
      ? `आज की मुख्य खबरें:\n${headlines}`
      : `Today's top headlines:\n${headlines}`;

    return { articles, summary };
  } catch (err) {
    logger.error('News API error:', err.message);
    return getMockNews(language);
  }
}

function getMockNews(language) {
  const summary = language === 'hi'
    ? 'समाचार सेवा अभी उपलब्ध नहीं है।'
    : 'News service is currently unavailable.';
  return { articles: [], summary };
}

module.exports = { getNews };
