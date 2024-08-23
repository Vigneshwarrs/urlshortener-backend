const {getUrlStats, getUserUrls, shortenUrl, redirectUrl } = require('../controllers/url');
const express = require('express');
const routes = express.Router();
const protect = require('../middlewares/auth');

// shorten the url from the original
routes.post('/shortenUrl', protect, shortenUrl);

// redirect to the original
routes.get('/:shortURL', redirectUrl);

// dashboard routes
routes.get('/dashboard/urls', protect, getUserUrls);
routes.get('/dashboard/stats', protect, getUrlStats);

module.exports = routes;