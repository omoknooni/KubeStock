from functools import lru_cache
from datetime import datetime, timedelta
import yfinance as yf
import aiohttp
import os
import time

from dotenv import load_dotenv
load_dotenv()
API_KEY = os.getenv("STOCK_API_KEY")
BASE_URL = "https://www.alphavantage.co/query"

# Simple Cache wrapper with timeout
# TODO : Redis같은 캐시처리
def timed_lru_cache(seconds: int, maxsize: int = 128):
    def wrapper_decorator(func):
        func = lru_cache(maxsize=maxsize)(func)
        func.lifetime = seconds
        func.expiration = time.time() + seconds

        def wrapped_func(*args, **kwargs):
            if time.time() > func.expiration:
                func.cache_clear()
                func.expiration = time.time() + func.lifetime
            return func(*args, **kwargs)

        return wrapped_func

    return wrapper_decorator

@timed_lru_cache(seconds=60, maxsize=128)
async def fetch_stock_data(symbol: str) -> dict:
    """
    주어진 종목(Symbol)의 데이터를 Alpha Vantage API에서 가져옴
    """
    params = {
        "function": "TIME_SERIES_INTRADAY",
        "symbol": symbol.upper().strip(),
        "interval": "5min",
        "apikey": API_KEY
    }

    if any(value is None for value in params.values()):
        raise ValueError(f"Invalid parameters provided.")

    async with aiohttp.ClientSession() as session:
        async with session.get(BASE_URL, params=params) as response:
            if response.status != 200:
                raise ValueError(f"Failed to fetch data. Status code: {response.status}")
            raw_data = await response.json()


            # API 제한 메시지 : {'Information': 'Thank you for using Alpha Vantage! Our standard API rate limit is 25 requests per day. Please subscribe to any of the premium plans at https://www.alphavantage.co/premium/ to instantly remove all daily rate limits.'}
            if "Information" in raw_data:
                raise ValueError(f"API 제한 메시지: {raw_data['Information']}")


            try:
                time_series = raw_data.get("Time Series (1min)")
                
                processed_data = [
                    {
                        "time": timestamp,  # ISO 8601 문자열 그대로 전달
                        "open": float(values["1. open"]),
                        "high": float(values["2. high"]),
                        "low": float(values["3. low"]),
                        "close": float(values["4. close"])
                    }
                    for timestamp, values in time_series.items()
                ]

                return processed_data if processed_data else None
            except aiohttp.ClientError as ce:
                raise ValueError(f"Network Error: {str(ce)}")
            except (ValueError, KeyError, TypeError) as e:
                raise ValueError(f"Error processing data: {str(e)}")


def fetch_stock_info(symbol: str):
    ticker = yf.Ticker(symbol)
    info = ticker.info

    short_info = {}

    quoteType = info.get('quoteType', 'N/A')
    short_info['quote_type'] = quoteType
    short_info['symbol'] = info.get('symbol', 'N/A')

    short_info['short_name']= info.get('shortName', 'N/A')
    short_info['business_summary'] = info.get('longBusinessSummary', 'No business summary available')
    if quoteType == 'EQUITY':
        short_info['industry'] = info.get('industry', 'N/A')
        short_info['sector'] = info.get('sector', 'N/A')
        short_info['per'] = info.get('trailingPE', 'N/A')
        short_info['pbr'] = info.get('priceToBook', 'N/A')
        short_info['eps'] = info.get('trailingEps', 'N/A')
        short_info['roe'] = info.get('returnOnEquity', 'N/A')
        short_info['roa'] = info.get('returnOnAssets', 'N/A')
    elif quoteType == 'ETF':
        short_info['fund_family'] = info.get('fundFamily', 'N/A')
        short_info['nav'] = info.get('navPrice', 'N/A')

    return short_info