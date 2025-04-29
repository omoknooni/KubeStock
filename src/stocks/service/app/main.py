from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from app.routers import stocks

from datetime import datetime
from dotenv import load_dotenv
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
import time

load_dotenv()
app = FastAPI(title="Stock Data Service", version="1.0")

# CORS
origins = [
    'http://localhost',
    'http://localhost:3000',
    'http://ui-service',
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(stocks.router)

@app.get("/")
def root():
    return {"message": "Welcome to the Stock Data Service"}

# Prometheus metrics
REQUEST_COUNT = Counter('request_count', 'Total number of requests', ["method", "endpoint", "http_status"])
REQUEST_LATENCY = Histogram('request_latency_seconds', 'Request latency (seconds)', ["endpoint"])
EXCEPTION_COUNT = Counter('exception_count', 'Total number of exceptions', ["endpoint", "exception"])

@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    """
    각 요청에 따른 Prometheus Metric을 수집하는 미들웨어
    """
    start_time = time.time()
    endpoint = request.url.path
    method = request.method
    try:
        response = await call_next(request)
        status_code = response.status_code
    except Exception as e:
        REQUEST_COUNT.labels(method=method, endpoint=endpoint, http_status=500).inc()
        EXCEPTION_COUNT.labels(endpoint=endpoint, exception=type(e).__name__).inc()
    finally:
        latency = time.time() - start_time
        REQUEST_COUNT.labels(method=method, endpoint=endpoint, http_status=status_code).inc()
        REQUEST_LATENCY.labels(endpoint=endpoint).observe(latency)
    return response

# Prometheus가 수집할 수 있는 Endpoint 생성
@app.get("/metrics")
def metrics():
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)