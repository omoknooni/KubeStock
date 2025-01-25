// index.js
require('dotenv').config();
const express = require('express');
const newsRoutes = require('./routes/news');

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어 설정
app.use(express.json());

// 뉴스 라우터 연결
app.use('/api/news', newsRoutes);

// 서버 실행
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
