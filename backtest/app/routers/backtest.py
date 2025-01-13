from fastapi import APIRouter, HTTPException
import backtrader as bt

from services.backtest import run

router = APIRouter(prefix="/backtest", tags=["backtest"])

@router.post("/run")
async def run_backtest(params: dict):
    """
    주어진 데이터 바탕으로 지원되는 전략이 있는지 판단 후 실행

    Args:
        params (dict): A dictionary containing the following keys:
            - strategy (str): The backtrader strategy to be tested.
            - ticker (str) : The ticker of the backtest.
            - initial_cash (float): The initial cash for the backtest.
            - start_date (datetime) : The start date of backtesting
            - end_date (datetime) : The end date of backtesting
            - commission (float): The commission for the backtest.
    Returns:
        backtesting_result (dict)
    """

    supported_strategies = ["sma", "rsi"]
    if params['strategy'] not in supported_strategies:
        raise HTTPException(status_code=400, detail="Unsupported strategy")

    backtesting_result = run(params)
    return backtesting_result