from typing import List, Dict
from pydantic import BaseModel
from collections import defaultdict
import pandas as pd
import yfinance as yf
import backtrader as bt
import logging
import traceback

logger = logging.getLogger('uvicorn.error')
logger.setLevel(logging.DEBUG)

# --- Input Data Schema ---
class PortfolioItem(BaseModel):
    ticker: str
    weight: float

class BacktestRequest(BaseModel):
    start_date: str
    end_date: str
    initial_capital: float
    cashflow: float
    cashflow_freq: str  # e.g., "monthly"
    portfolio: List[PortfolioItem]


# --- Backtrader Strategy ---
class SimpleMovingAverage(bt.Strategy):
    """
    A simple moving average strategy for backtesting.
    """
    params = (
        ('sma_short_period', 20),
        ('sma_long_period', 50),
        ('cashflow', 0),
        ('cashflow_freq', "monthly")
    )

    def log(self, txt, dt=None):
        """
        Logging function for the strategy.
        """
        dt = dt or self.datas[0].datetime.date(0).isoformat()
        logger.info('%s, %s', dt, txt)

    def __init__(self):
        """
        Initialize the strategy by creating a moving average indicator.
        """
        self.sma_short = {}
        self.sma_long = {}
        self.portfolio_value = []
        self.drawdowns = []
        self.counter = 0
        self.dataclose = self.datas[0].close

        for data in self.datas:
            self.sma_short[data] = bt.indicators.SimpleMovingAverage(data.close, period=self.params.sma_short_period)
            self.sma_long[data] = bt.indicators.SimpleMovingAverage(data.close, period=self.params.sma_long_period)

    def next(self):
        """
        Execute the strategy logic for each trading day.
        """
        date = self.datetime.date(0).isoformat()
        portfolio_value = self.broker.getvalue()

        # drawdown 분석
        drawdown_analyzer = self.analyzers.drawdown.get_analysis()
        drawdown_value = drawdown_analyzer.drawdown if "drawdown" in drawdown_analyzer else 0
        
        self.portfolio_value.append((date, portfolio_value))
        self.drawdowns.append((date, drawdown_value))

        # Cashflow injection logic (monthly or yearly)
        if self.params.cashflow > 0 and self.params.cashflow_freq == "monthly":
            if self.counter % 20 == 0:  # Roughly once a month (20 trading days)
                self.broker.add_cash(self.params.cashflow)
        self.counter += 1
        
        # run SMA Strategy
        for data in self.datas:
            ticker = data._name
            pos = self.getposition(data).size

            sma_short = self.sma_short[data][0]
            sma_long = self.sma_long[data][0]

            # Buy if short SMA crosses above long SMA
            if sma_short > sma_long and pos == 0:
                cash_available = self.broker.get_cash()
                size = cash_available / len(self.datas) / data.close[0]
                self.buy(data=data, size=size)

            # Sell if short SMA crosses below long SMA
            elif sma_short < sma_long and pos > 0:
                self.sell(data=data, size=pos)
        self.log(f"Portfolio Value: {self.broker.getvalue():.2f}, Pos: {pos}, Close: {self.dataclose[0]}, Drawdown: {drawdown_value:.2f}")

class RSI(bt.Strategy):
    """
    A relative strength index (RSI) strategy for backtesting.
    """
    params = (('rsi_period', 14), ('rsi_upper', 70), ('rsi_lower', 30))

    def __init__(self):
        """
        Initialize the strategy by creating an RSI indicator.
        """
        self.rsi = bt.indicators.RSI(self.data.close, period=self.params.rsi_period)

    def next(self):
        """
        Execute the strategy logic for each trading day.
        """
        if self.position.size == 0:
            # Buy if the RSI is below the lower threshold
            if self.rsi[0] < self.params.rsi_lower:
                self.buy()
        else:
            # Sell if the RSI is above the upper threshold
            if self.rsi[0] > self.params.rsi_upper:
                self.sell()


# --- Helper Functions ---
def fetch_data(ticker: str, start: str, end: str):
    try:
        # Download data from yfinance
        # yfinance module Version Issue : use "0.2.43"
        df = yf.download(ticker, start=start, end=end)

        df.rename(columns={
            "Open": "open",
            "High": "high",
            "Low": "low",
            "Close": "close",
            "Volume": "volume",
        }, inplace=True)

        if df.empty:
            raise ValueError(f"No data found for ticker {ticker} in the given date range.")
        # Convert to Backtrader data feed
        data = bt.feeds.PandasData(dataname=df)
        return data
    except Exception as e:
        raise ValueError(f"Error fetching data for {ticker}: {e}")


def calculate_annual_returns(portfolio_values):
    """Calculate annual returns from daily portfolio values."""

    # Create a dictionary to track yearly values
    yearly_returns = defaultdict(list)
    for date, value in portfolio_values:
        year = pd.to_datetime(date).year
        yearly_returns[year].append(value)

    annual_returns = []
    for year, values in yearly_returns.items():
        start_value = values[0]
        end_value = values[-1]
        annual_return = ((end_value / start_value) - 1) * 100
        annual_returns.append({"year": year, "return": annual_return})
    return annual_returns

def run_backtest(params: BacktestRequest):
    cerebro = bt.Cerebro()

    # Add strategy with parameters
    # strategy = PortfolioStrategy
    # cerebro.addstrategy(strategy, cashflow=params.cashflow, cashflow_freq=params.cashflow_freq)

    strategy = SimpleMovingAverage
    cerebro.addstrategy(strategy, cashflow=params.cashflow, cashflow_freq=params.cashflow_freq)

    # Add data feeds
    logger.debug("Add data feeds")
    for item in params.portfolio:
        try:
            data = fetch_data(item.ticker, params.start_date, params.end_date)
            cerebro.adddata(data, name=item.ticker)
        except ValueError as e:
            logger.debug(f"Failed to add data for ticker {item.ticker}: {e}")
            raise ValueError(f"Failed to add data for ticker {item.ticker}: {e}")

    # Set initial capital and commission
    logger.debug("Set initial capital and commission")
    cerebro.broker.setcash(params.initial_capital)
    cerebro.broker.setcommission(commission=0.001)

    # Set drawdown analyzer
    cerebro.addanalyzer(bt.analyzers.DrawDown, _name="drawdown")

    # Run the backtest
    logger.debug("Run the backtest")
    try:
        results = cerebro.run()
    except Exception as e:
        logger.debug(f"Error during backtest: {e}")
        logger.debug(traceback.format_exc())
        raise ValueError(f"Error during backtest: {e}")
    strategy_instance = results[0]  # Get the first strategy instance

    # Extract portfolio performance data
    performance = strategy_instance.portfolio_value
    drawdown = strategy_instance.drawdowns
    annual_returns = calculate_annual_returns(performance)

    return {
        "performance": performance,  # List of (date, value)
        "drawdown": drawdown,  # List of (date, value)
        "annual_returns": annual_returns  # List of {"year": int, "return": float}
    }
