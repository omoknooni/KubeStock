// controllers/newsController.js
const { db } = require('../db');

// Constants
const NEWS_TYPES = {
    MAIN: 'main',
    HOT: 'hot',
    TODAY: 'today'
};

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;

// Utility functions
const getQueryConfig = (type) => {
    const configs = {
        [NEWS_TYPES.MAIN]: {
            query: `
                SELECT id, title, link, pub_date, created_at, source, media_url 
                FROM ?? 
                WHERE pub_date >= NOW() - INTERVAL 7 DAY 
                ORDER BY pub_date DESC 
                LIMIT 15
            `,
            limit: 15
        },
        [NEWS_TYPES.HOT]: {
            query: `
                SELECT id, title, link, pub_date, created_at, source, media_url 
                FROM ?? 
                ORDER BY pub_date DESC 
                LIMIT 20
            `,
            limit: 20
        },
        [NEWS_TYPES.TODAY]: {
            query: `
                SELECT id, title, link, pub_date, created_at, source, media_url 
                FROM ?? 
                WHERE DATE(pub_date) = CURDATE() 
                ORDER BY pub_date DESC 
                LIMIT 30
            `,
            limit: 30
        }
    };
    return configs[type];
};

// Error handler
const handleError = (error, res, operation) => {
    console.error(`[${operation}] DB Query Error: ${error.message}`);
    return res.status(500).json({ 
        success: false, 
        message: 'Internal Server Error' 
    });
};

// Controllers
exports.getNewsById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query(
            'SELECT * FROM rss_news WHERE id = ?', 
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'News not found' 
            });
        }

        return res.status(200).json({ 
            success: true, 
            data: rows[0] 
        });
    } catch (error) {
        return handleError(error, res, 'getNewsById');
    }
};

const getNewsListFromTable = (tableName) => {
    return async (req, res) => {
        try {
            const { type = 'all' } = req.query;
            const queryConfig = getQueryConfig(type);

            if (!queryConfig) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Invalid type' 
                });
            }

            const [rows] = await db.query(queryConfig.query, [tableName]);
            const [[{ total }]] = await db.query(
                'SELECT COUNT(*) AS total FROM ??', 
                [tableName]
            );

            return res.status(200).json({
                success: true,
                page: DEFAULT_PAGE,
                limit: queryConfig.limit,
                total,
                totalPages: Math.ceil(total / queryConfig.limit),
                data: rows
            });
        } catch (error) {
            return handleError(error, res, 'getNewsList');
        }
    };
};

// Exports
exports.getNewsList = getNewsListFromTable('rss_news');
exports.getKoNewsList = getNewsListFromTable('rss_news_ko');
