from functools import lru_cache
from datetime import datetime
import pymysql
import yfinance as yf
import aiohttp
import os
import time

from dotenv import load_dotenv
load_dotenv()
API_KEY = os.getenv("STOCK_API_KEY")
BASE_URL = "https://www.alphavantage.co/query"

DB_CONFIG = {
    "host": os.getenv("DB_HOST"),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "database": os.getenv("DB_NAME"),
}

def get_conn():
    return pymysql.connect(**DB_CONFIG, cursorclass=pymysql.cursors.DictCursor)

def search_ticker(query: str):
    """
    주어진 검색어를 포함하는 주식 종목 ticker와 full_name을 검색합니다.
    """
    # res = [{"ticker": "AAPL", "name": "APPLE Inc."},]

    try:
        conn = get_conn()
        with conn.cursor() as cursor:
            sql = "SELECT ticker, name FROM market_stocks WHERE ticker LIKE %s ORDER BY LENGTH(ticker) ASC LIMIT 10"
            cursor.execute(sql, (f"%{query.query}%"))
            results = cursor.fetchall()
            res = [{"ticker": row['ticker'], "name": row['name']} for row in results]
    except Exception as e:
        raise ValueError(f"Database Error: {str(e)}")
    finally:
        conn.close()

    return res

### 실시간 종목 데이터 Fetch API 찾아야함
# # Simple Cache wrapper with timeout
# # TODO : Redis같은 캐시처리
# def timed_lru_cache(seconds: int, maxsize: int = 128):
#     def wrapper_decorator(func):
#         func = lru_cache(maxsize=maxsize)(func)
#         func.lifetime = seconds
#         func.expiration = time.time() + seconds

#         def wrapped_func(*args, **kwargs):
#             if time.time() > func.expiration:
#                 func.cache_clear()
#                 func.expiration = time.time() + func.lifetime
#             return func(*args, **kwargs)

#         return wrapped_func

#     return wrapper_decorator

# @timed_lru_cache(seconds=60, maxsize=128)
# async def fetch_stock_data(symbol: str) -> dict:
#     """
#     주어진 종목(Symbol)의 데이터를 Alpha Vantage API에서 가져옴
#     API Docs : https://www.alphavantage.co/documentation/
#     """
#     params = {
#         "function": "TIME_SERIES_INTRADAY",
#         "symbol": symbol.upper().strip(),
#         "interval": "5min",
#         "apikey": API_KEY
#     }

#     if any(value is None for value in params.values()):
#         raise ValueError(f"Invalid parameters provided.")

#     async with aiohttp.ClientSession() as session:
#         async with session.get(BASE_URL, params=params) as response:
#             if response.status != 200:
#                 raise ValueError(f"Failed to fetch data. Status code: {response.status}")
#             raw_data = await response.json()


#             # API 제한 메시지 : {'Information': 'Thank you for using Alpha Vantage! Our standard API rate limit is 25 requests per day. Please subscribe to any of the premium plans at https://www.alphavantage.co/premium/ to instantly remove all daily rate limits.'}
#             if "Information" in raw_data:
#                 raise ValueError(f"API 제한 메시지: {raw_data['Information']}")


#             try:
#                 time_series = raw_data.get(f"Time Series ({params['interval']})")
                
#                 processed_data = [
#                     {
#                         "time": int(time.mktime(datetime.strptime(timestamp, "%Y-%m-%d %H:%M:%S").timetuple())),  # convert to unix timestamp
#                         "open": float(values["1. open"]),
#                         "high": float(values["2. high"]),
#                         "low": float(values["3. low"]),
#                         "close": float(values["4. close"])
#                     }
#                     for timestamp, values in sorted(time_series.items())
#                 ]

#                 return processed_data if processed_data else None
#             except aiohttp.ClientError as ce:
#                 raise ValueError(f"Network Error: {str(ce)}")
#             except (ValueError, KeyError, TypeError) as e:
#                 raise ValueError(f"Error processing data: {str(e)}")


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
