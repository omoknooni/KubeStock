import backtrader as bt

# make class for Simple Moving Average Strategy
class SimpleMovingAverage(bt.Strategy):
    """
    A simple moving average strategy for backtesting.
    """
    params = (('sma_period', 20),)

    def __init__(self):
        """
        Initialize the strategy by creating a moving average indicator.
        """
        self.sma = bt.indicators.SimpleMovingAverage(
            self.data.close, period=self.params.sma_period)

    def next(self):
        """
        Execute the strategy logic for each trading day.
        """
        if self.position.size == 0:
            # Buy if the closing price is above the moving average
            if self.data.close[0] > self.sma[0]:
                self.buy()
        else:
            # Sell if the closing price is below the moving average
            if self.data.close[0] < self.sma[0]:
                self.sell()

# make class for RSI Strategy
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

def run(params):
    """
    Run a backtest with the given parameters.

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
    # Create a backtrader Cerebro instance
    cerebro = bt.Cerebro()

    if params['strategy'] == 'sma':
        strategy = SimpleMovingAverage
    elif params['strategy'] == 'rsi':
        strategy = RSI


    # Add the strategy to the Cerebro instance
    cerebro.addstrategy(params['strategy'])

    # data feed를 위한 fetch 작업

    # Create a backtrader Data Feed instance
    data = bt.feeds.YahooFinanceData(
        dataname=params['ticker'],
        fromdate=params['start_date'],
        todate=params['end_date'],
        reverse=False
    )

    # Add the Data Feed to the Cerebro instance
    cerebro.adddata(data)

    # Set the initial cash for the backtest -> 초기 자본금
    cerebro.broker.setcash(params['initial_cash'])

    # Set the commission for the backtest -> 거래 수수료
    cerebro.broker.setcommission(commission=params['commission'], margin=params['margin'])

    # Add the analyzers to the Cerebro instance -> 결과 분석과 통계를 제공하는 구성요소
    # Sharp Ratio : 위험 대비 수익률
    # Draw Down : 포폴의 최대 손실 (최대 낙폭)
    # Trade Analyzer : 거래 요약 (승/패 거래 수, 평균 수익 등)
    cerebro.addanalyzer(bt.analyzers.SharpeRatio, _name='sharpe_ratio')
    cerebro.addanalyzer(bt.analyzers.DrawDown, _name='draw_down')
    cerebro.addanalyzer(bt.analyzers.TradeAnalyzer, _name='trade_analyzer')

    # Run the backtest
    backtest_result = cerebro.run()

    # Return the backtest result
    return {
        'ticker': params['ticker'],
        'strategy': params['strategy'],
        'initial_cash': params['initial_cash'],
        'commission': params['commission'],
        'start_date': params['start_date'],
        'end_date': params['end_date'],
        'sharpe_ratio': backtest_result[0].analyzers.sharpe_ratio.get_analysis()['sharperatio'],
        'max_draw_down': backtest_result[0].analyzers.draw_down.get_analysis()['max']['drawdown'],
        'total_return': backtest_result[0].analyzers.trade_analyzer.get_analysis()['total']['total'],
        'winning_trades': backtest_result[0].analyzers.trade_analyzer.get_analysis()['won']['total'],
        'losing_trades': backtest_result[0].analyzers.trade_analyzer.get_analysis()['lost']['total'],
        'average_winning_trade': backtest_result[0].analyzers.trade_analyzer.get_analysis()['won']['pnl']['average'],
        'average_losing_trade': backtest_result[0].analyzers.trade_analyzer.get_analysis()['lost']['pnl']['average'],
        'final_portfolio_value': cerebro.broker.getvalue()
    }
    