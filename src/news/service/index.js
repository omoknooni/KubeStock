// index.js
require('dotenv').config();
const express = require('express');
const newsRoutes = require('./routes/news');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
const { db, testConnection } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어 설정
app.use(express.json());

// Swagger UI 설정
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// 뉴스 라우터 연결
app.use('/api/news', newsRoutes);

app.get('/health', (req, res) => {
    res.send('Welcome to the News Service');
});

// DB test connection
testConnection();

// 서버 실행
app.listen(PORT, () => {
    console.log(`Server is running on ${PORT}`);
    console.log(`Swagger UI is available at /api-docs`);
});
