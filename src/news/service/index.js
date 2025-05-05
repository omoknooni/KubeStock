// index.js
require('dotenv').config();
const express = require('express');
const { Counter, Histogram, collectDefaultMetrics, register } = require('prom-client');

const newsRoutes = require('./routes/news');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
const { db, testConnection } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Define Prometheus Metric
client.collectDefaultMetrics();

// 2) 사용자 정의 메트릭 정의
const requestCount = new Counter({
    name: 'request_count',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'http_status'],
  });
  
  const requestLatency = new Histogram({
    name: 'request_latency_seconds',
    help: 'Request latency in seconds',
    labelNames: ['route'],
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  });
  
  const exceptionCount = new Counter({
    name: 'exception_count',
    help: 'Total number of exceptions',
    labelNames: ['route', 'exception'],
  });
  
  // 3) 메트릭 제외 & 측정 미들웨어
  app.use((req, res, next) => {
    // /metrics 요청은 측정에서 제외
    if (req.path === '/metrics') {
      return next();
    }
  
    // 타이머 시작
    const endTimer = requestLatency.startTimer({ route: req.route?.path || req.path });
  
    // 응답이 끝난 뒤 카운터 & 예외 체크
    res.on('finish', () => {
      const route = req.route?.path || req.path;
      const status = res.statusCode;
  
      // 요청 카운트
      requestCount.labels(req.method, route, status).inc();
  
      // latency 관측
      endTimer();
  
      // HTTP 5xx를 예외로 간주해 exception_count 증가
      if (status >= 500) {
        exceptionCount.labels(route, `HTTP_${status}`).inc();
      }
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

app.use((err, req, res, next) => {
    const route = req.route?.path || req.path;
    exceptionCount.labels(route, err.name).inc();
    next(err);
  });

// Prometheus Metric Endpoint
app.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
});

// DB test connection
testConnection();

// 서버 실행
app.listen(PORT, () => {
    console.log(`Server is running on ${PORT}`);
    console.log(`Swagger UI is available at /api-docs`);
});
