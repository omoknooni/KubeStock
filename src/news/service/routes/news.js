// routes/news.js
const express = require('express');
const { getAllNews, getNewsById } = require('../controllers/newsController');

const router = express.Router();

// 전체 뉴스 가져오기
router.get('/', getAllNews);

// 특정 뉴스 가져오기
router.get('/:id', getNewsById);

module.exports = router;
