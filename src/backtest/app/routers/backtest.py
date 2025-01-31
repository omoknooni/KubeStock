from fastapi import APIRouter, HTTPException
from ..services.backtest import BacktestRequest, run_backtest

router = APIRouter(prefix="/backtest", tags=["backtest"])

@router.post("/")
async def backtest(params: BacktestRequest):
    """
    Run backtest for input ticker, parameters

    Input:

    """
    try:
        result = run_backtest(params)
        return {
            "performance": result["performance"],
            "drawdown": result["drawdown"],
            "annual_returns": result["annual_returns"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))