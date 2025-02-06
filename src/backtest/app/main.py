from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from services.backtest import BacktestRequest, run_backtest

from datetime import datetime
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

@app.get("/")
def root():
    return {"message": "Welcome to the Stock Backtesting Service"}


@app.post("/run")
async def backtest(params: BacktestRequest):
    """
    Run backtest for input ticker, parameters

    Input:
    {
        "start_date": YYYY-mm-dd,
        "end_date": YYYY-mm-dd,
        "initial_capital": int,
        "cashflow": int,
        "cashflow_freq": str,
        "portfolio": [
            {
                "name": str,
                "allocation": {
                    str: float,
                },
                "drag": int,
                "invest_dividends": bool,
                "rebalance_freq": str
            }
        ]
    }
    Output:
    {
        "start_date": ,
        "performance": ,
        "drawdown": ,
        "annual_returns": 
    }

    """
    try:
        # Date range validation
        start_date = datetime.strptime(params.start_date, "%Y-%m-%d")
        end_date = datetime.strptime(params.end_date, "%Y-%m-%d")
        if start_date > end_date:
            raise HTTPException(status_code=400, detail="Start date must be before end date")
        
        # Date range is restricted by 1year maximum
        if abs((end_date - start_date).days) > 365:
            raise HTTPException(status_code=400, detail="Date range must be within 1 year (under developing)")

        if len(params.portfolio) == 0:
            raise HTTPException(status_code=400, detail="Portfolio must not be empty")
        elif len(params.portfolio) >=4:
            raise HTTPException(status_code=400, detail="Portfolio must not be more than 4 (Under developing)")
        else:
            total_result = {
                "performance": [],
                "drawdown": [],
                "annual_returns": []
            }

            # run backtest by portfolio
            for portfolio in params.portfolio:
                result = run_backtest(
                    params.start_date,
                    params.end_date,
                    params.initial_capital,
                    params.cashflow,
                    params.cashflow_freq,
                    portfolio
                )

                total_result["date"] = result["date"]
                total_result["performance"].append({result['name']: result["performance"]})
                total_result["drawdown"].append({result['name']: result["drawdown"]})
                total_result["annual_returns"].append({result['name']: result["annual_returns"]})

        return total_result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))