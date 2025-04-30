// index.js
require('dotenv').config();
const express = require('express');
const client = require('prom-client');

const newsRoutes = require('./routes/news');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
const { db, testConnection } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Define Prometheus Metric
client.collectDefaultMetrics();

// HTTP 요청 지연 Metric 수집
const httpRequestDurationMs = new client.Histogram({
    name: 'http_request_duration_ms',
    help: 'HTTP 요청 지연 시간 (ms)',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [50, 100, 200, 300, 500, 1000],
  });
  
// 모든 요청에 Metric 수집되도록 미들웨어
app.use((req, res, next) => {
    const endTimer = httpRequestDurationMs.startTimer({
        method: req.method,
        route: req.route ? req.route.path : req.path,  // 라우트 패턴으로 라벨링
    });
    res.on('finish', () => {
        endTimer({ status_code: res.statusCode });
    });
    next();
});

// 미들웨어 설정
app.use(express.json());

// Swagger UI 설정
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// 뉴스 라우터 연결
app.use('/api/news', newsRoutes);

app.get('/health', (req, res) => {
    res.send('Welcome to the News Service');
});

// Prometheus Metric Endpoint
app.get('/metrics', async (req, res) => {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
});

// DB test connection
testConnection();

// 서버 실행
app.listen(PORT, () => {
    console.log(`Server is running on ${PORT}`);
    console.log(`Swagger UI is available at /api-docs`);
});
