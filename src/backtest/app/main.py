from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import backtest

# from dotenv import load_dotenv

# load_dotenv()
app = FastAPI(title="Stock Backtesting Service", version="1.0")

# CORS
origins = [
    'http://localhost',
    'http://localhost:3000',
    'http://ui-service'
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(backtest.router)

@app.get("/")
def root():
    return {"message": "Welcome to the Stock Backtesting Service"}