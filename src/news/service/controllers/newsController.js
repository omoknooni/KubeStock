// controllers/newsController.js
const db = require('../db');

exports.getAllNews = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM rss_news ORDER BY pub_date DESC');
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

exports.getNewsById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query('SELECT * FROM rss_news WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'News not found' });
        }
        res.status(200).json({ success: true, data: rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

exports.getNewsList = async (req, res) => {
    try {
        // 요청된 페이지와 한 페이지당 개수 (기본값: page=1, limit=10)
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // 조회할 뉴스 타입 (기본값: all / 입력가능 값: 'main', 'hot', 'all')
        const type = req.query.type || 'all';

        // 뉴스 목록 조회 (title, link, pub_date, source, media_url 만 가져오기)
        if (type === "main") {
            q = `SELECT title, link, pub_date, source, media_url FROM rss_news
                WHERE pub_date >= NOW() - INTERVAL 7 DAY
                AND 
                ORDER BY pub_date DESC
                LIMIT 15`;
        }
        else if (type === "hot") {
            page = 2;
            limit = 10;
            q = `SELECT title, link, pub_date, source, media_url FROM rss_news
                ORDER BY pub_date DESC
                LIMIT 10`;
        }
        else if (type === "all") {
            page = 5;
            limit = 30;
            q = `SELECT title, link, pub_date, source, media_url FROM rss_news
                ORDER BY pub_date DESC
                LIMIT 30`;
        }
        else {
            return res.status(400).json({ success: false, message: "Invalid type" });
        }
        
        // const [rows] = await db.query(
        //     `SELECT title, link, pub_date, source, media_url
        //      FROM rss_news
        //      ORDER BY pub_date DESC
        //      LIMIT ? OFFSET ?`,
        //     [limit, offset]
        // );
        const [rows] = await db.query(q);


        // 총 뉴스 개수 조회
        const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM rss_news`);

        res.status(200).json({
            success: true,
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            data: rows
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};
