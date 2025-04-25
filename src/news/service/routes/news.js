const express = require('express');
const { getAllNews, getNewsById, getNewsList, getKoNewsList } = require('../controllers/newsController');

const router = express.Router();

// 전체 뉴스 가져오기
/**
 * @swagger
 * /api/news:
 *   get:
 *     summary: 뉴스 목록 조회 (페이지네이션 지원)
 *     description: 뉴스 데이터를 최신순으로 가져옵니다.
 *     parameters:
 *       - in: query
 *         name: page
 *         description: 가져올 페이지 번호 (기본값 1)
 *         schema:
 *           type: integer
 *         required: false
 *       - in: query
 *         name: limit
 *         description: 한 페이지당 뉴스 개수 (기본값 10)
 *         schema:
 *           type: integer
 *         required: false
 *       - in: query
 *         name: type
 *         description: 가져올 기사 타입 (기본값 all)
 *         schema:
 *           type: string
 *           enum: [all, hot, main]
 *         required: false
 *     responses:
 *       200:
 *         description: 뉴스 목록을 성공적으로 반환
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 limit:
 *                   type: integer
 *                   example: 10
 *                 total:
 *                   type: integer
 *                   example: 100
 *                 totalPages:
 *                   type: integer
 *                   example: 10
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       title:
 *                         type: string
 *                         example: "Breaking News: AI Advances"
 *                       link:
 *                         type: string
 *                         example: "https://news.com/article1"
 *                       pub_date:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-02-01T12:00:00.000Z"
 *                       source:
 *                         type: string
 *                         example: "TechNews"
 *                       media_url:
 *                         type: string
 *                         example: "https://news.com/image1.jpg"
 *       500:
 *         description: 서버 오류 발생
 */
router.get('/', getNewsList);

// 한국어 뉴스
router.get('/ko', getKoNewsList);

// 특정 뉴스 가져오기
router.get('/:id', getNewsById);

module.exports = router;