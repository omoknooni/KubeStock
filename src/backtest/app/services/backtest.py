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
    name: str
    allocation: Dict[str, float]  # e.g., {"AAPL": 50, "GOOGL": 50} => sum must be 100
    drag: float
    invest_dividends: bool
    rebalance_freq: str  # e.g., "monthly / yearly"
class BacktestRequest(BaseModel):
    start_date: str
    end_date: str
    initial_capital: float
    cashflow: float
    cashflow_freq: str  # e.g., "monthly"
    adjust_inflation: bool
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
        
        # 계좌잔고와 drawdown_value는 소수점 둘째 자리까지만
        portfolio_value = round(portfolio_value, 2)
        drawdown_value = round(drawdown_value, 2)

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

class PortfolioRebalanceStrategy(bt.Strategy):
    params = (
        ('portfolio_allocation', {}),  # 종목별 목표 비중
        ('cashflow', 0),  # 캐시플로우 금액
        ('cashflow_freq', 'monthly'),  # 캐시플로우 주기
        ('invest_dividends', False),  # 배당 재투자 여부
        ('adjust_inflation', False),  # 인플레이션 조정 여부
        ('abs_band', 0),    # 절대 편차 (%)
        ('rel_band', 0),    # 상대 편차 (%)
        ('rebalance_freq', 'monthly'),  # 리밸런싱 주기
    )

    def __init__(self):
        self.counter = 0  # 거래일 카운터
        self.inflation_factor = 1  # 인플레이션 보정 계수
        self.portfolio_value = []   # 포트폴리오 가치
        self.drawdowns = [] # 하락률
        self.dataclose = self.datas[0].close
        self.rebalance_dates = self.get_rebalance_days()
        self.initial_invested = False

        # 배당금 추적을 위한 변수
        self.dividends = {data: 0 for data in self.datas}
        
        # 캐시플로우 적용일 계산
        self.cashflow_days = self.get_cashflow_days()
    
    # Logging function for the strategy
    def log(self, txt, dt=None):
        dt = dt or self.datas[0].datetime.date(0).isoformat()
        logger.info('%s, %s', dt, txt)

    def get_cashflow_days(self):
        start_date = self.datas[0].datetime.date(0)
        if self.params.cashflow_freq == 'monthly':
            return {d.strftime('%Y-%m-%d') for d in pd.date_range(start_date, periods=100, freq='M')}
        return set()

    def get_rebalance_days(self):
        start_date = self.datas[0].datetime.date(0)
        if self.params.rebalance_freq == 'monthly':
            return {d.strftime('%Y-%m-%d') for d in pd.date_range(start_date, periods=100, freq='M')}
        elif self.params.rebalance_freq == 'yearly':
            return {d.strftime('%Y-%m-%d') for d in pd.date_range(start_date, periods=100, freq='Y')}
        return set()

    def next(self):
        date = self.datetime.date(0).isoformat()
        portfolio_value = self.broker.getvalue()

        # 초기 매수
        if not self.initial_invested:
            self.initial_buy()
            self.initial_invested = True

        # drawdown 분석
        drawdown_analyzer = self.analyzers.drawdown.get_analysis()
        drawdown_value = drawdown_analyzer.drawdown if "drawdown" in drawdown_analyzer else 0
        
        # 계좌잔고와 drawdown_value는 소수점 둘째 자리까지만
        portfolio_value = round(portfolio_value, 2)
        drawdown_value = round(drawdown_value, 2)

        self.portfolio_value.append((date, portfolio_value))
        self.drawdowns.append((date, drawdown_value))
        
        # 인플레이션 조정 (1970년 가치로 환산)
        if self.params.adjust_inflation:
            self.inflation_factor = self.get_inflation_factor(date)
            portfolio_value /= self.inflation_factor

        # 배당금 자동 재투자
        if self.params.invest_dividends:
            for data in self.datas:
                self.broker.add_cash(self.dividends[data])
                self.dividends[data] = 0
        
        # 캐시플로우 처리
        if date in self.cashflow_days and self.params.cashflow > 0:
            cash_to_add = self.params.cashflow / self.inflation_factor
            self.broker.add_cash(cash_to_add)
            self.log(f"Cashflow injected: {cash_to_add:.2f}")

        # 리밸런싱 처리
        if date in self.rebalance_dates:
            self.rebalance(portfolio_value)

        for data in self.datas:
            pos = self.getposition(data).size
            self.log(f"Ticker: {data._name}, Position: {pos}, Portfolio Value: {self.broker.getvalue():.2f}, Close: {self.dataclose[0]}, Drawdown: {drawdown_value:.2f}")


    def initial_buy(self):
        """ 백테스트 시작 시점에서 포트폴리오 비중에 맞춰 종목 매수 """
        total_cash = self.broker.get_cash()
        self.log(f"Initial buy: {total_cash:.2f}")
        
        for data in self.datas:
            ticker = data._name
            target_weight = self.params.portfolio_allocation.get(ticker, 0) / 100  # 비중 변환
            self.log(f"Target weight for {ticker}: {target_weight:.2f}")
            if target_weight > 0:
                amount_to_invest = total_cash * target_weight
                size = amount_to_invest / data.close[0]
                if size > 0:
                    self.buy(data=data, size=size)
                    self.log(f"Initial buy: {ticker}, Size: {size:.2f}, Price: {data.close[0]:.2f}")
                else:
                    self.log(f"Insufficient size for {ticker}: size={size:.2f}")

    # 리밸런싱
    def rebalance(self, portfolio_value):
        target_allocations = self.params.portfolio_allocation
        total_cash = self.broker.get_cash()
        
        for data in self.datas:
            ticker = data._name
            target_weight = target_allocations.get(ticker, 0) / 100  # 비중 변환
            current_value = self.getposition(data).size * data.close[0]
            target_value = portfolio_value * target_weight
            
            abs_band_min = target_value * (1 - self.params.abs_band / 100)
            abs_band_max = target_value * (1 + self.params.abs_band / 100)
            rel_band_min = target_value * (1 - self.params.rel_band / 100)
            rel_band_max = target_value * (1 + self.params.rel_band / 100)
            
            # 리밸런싱 필요 여부 확인
            if current_value < abs_band_min or current_value > abs_band_max or \
               current_value < rel_band_min or current_value > rel_band_max:
                order_size = (target_value - current_value) / data.close[0]
                if order_size > 0:
                    self.buy(data=data, size=order_size)
                    self.log(f"Rebalance buy for {ticker}: size={order_size:.2f}")
                elif order_size < 0:
                    self.sell(data=data, size=-order_size)
                    self.log(f"Rebalance sell for {ticker}: size={-order_size:.2f}")

    def get_inflation_factor(self, date):
        # 여기서 CPI 데이터를 가져와 인플레이션 보정 계수를 계산할 수 있음.
        # 예제에서는 간단한 가정으로 처리 (실제 CPI 데이터를 반영하려면 외부 데이터 필요)
        base_year = 1970
        current_year = date.year
        inflation_rate = 0.03  # 연평균 3% 인플레이션 가정
        return (1 + inflation_rate) ** (current_year - base_year)



# --- Helper Functions ---
def fetch_data(ticker: str, start: str, end: str):
    try:
        # Download data from yfinance
        df = yf.download(ticker, start=start, end=end)

        # Convert shape of df with correct shape of BT's DataFeed 
        df.columns = df.columns.droplevel(1)
        df = df.rename(columns={"Price": "Close"})
        df.columns.name = None
        df = df.reset_index().rename(columns={"index":"Date"}).set_index("Date")

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

def run_backtest(
        start_date: str,
        end_date: str,
        initial_capital: float,
        cashflow: float,
        cashflow_freq: str,
        adjust_inflation: bool,
        portfolio: List[PortfolioItem],
):
    cerebro = bt.Cerebro()

    # Add strategy with parameters
    strategy = PortfolioRebalanceStrategy
    cerebro.addstrategy(
        strategy,
        portfolio_allocation=portfolio.allocation,
        cashflow=cashflow,
        cashflow_freq=cashflow_freq,
        invest_dividends=portfolio.invest_dividends,
        adjust_inflation=adjust_inflation,
        rebalance_freq=portfolio.rebalance_freq
    )

    # strategy = SimpleMovingAverage
    # cerebro.addstrategy(strategy, cashflow=cashflow, cashflow_freq=cashflow_freq)

    # Add data feeds
    logger.debug("Add data feeds")
    for item in portfolio.allocation:
        try:
            data = fetch_data(item, start_date, end_date)
            cerebro.adddata(data, name=item)
        except ValueError as e:
            logger.debug(f"Failed to add data for ticker {item}: {e}")
            raise ValueError(f"Failed to add data for ticker {item}: {e}")

    # Set initial capital and commission
    logger.debug("Set initial capital and commission")
    cerebro.broker.setcash(initial_capital)
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
    date, performance = zip(*strategy_instance.portfolio_value)
    drawdown = [dd for _,dd in strategy_instance.drawdowns]
    annual_returns = calculate_annual_returns(strategy_instance.portfolio_value)

    return {
        "name": portfolio.name,
        "date": list(date),
        "performance": list(performance),
        "drawdown": list(drawdown),
        "annual_returns": annual_returns  # List of {"year": int, "return": float}
    }
