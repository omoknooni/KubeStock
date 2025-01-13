import yfinance as yf
import pprint
import aiohttp
import os

API_KEY = os.getenv("STOCK_API_KEY")
BASE_URL = "https://www.alphavantage.co/query"

async def fetch_stock_data(symbol: str) -> dict:
    """
    주어진 종목(Symbol)의 데이터를 Alpha Vantage API에서 가져옴
    """
    params = {
        "function": "TIME_SERIES_INTRADAY",
        "symbol": symbol,
        "interval": "1min",
        "apikey": API_KEY
    }
    async with aiohttp.ClientSession() as session:
        async with session.get(BASE_URL, params=params) as response:
            if response.status == 200:
                raw_data = await response.json()
                print(raw_data)
                # API 제한 메시지 : {'Information': 'Thank you for using Alpha Vantage! Our standard API rate limit is 25 requests per day. Please subscribe to any of the premium plans at https://www.alphavantage.co/premium/ to instantly remove all daily rate limits.'}
                if "Information" in raw_data:
                    raise ValueError(f"API 제한 메시지: {raw_data['Information']}")

                time_series = raw_data.get("data").get("Time Series (1min)")

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

                return processed_data
            else:
                raise ValueError(f"Failed to fetch data. Status code: {response.status}")


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