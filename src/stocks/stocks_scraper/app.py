import pymysql
import requests
import os
import pandas as pd

from dotenv import load_dotenv

load_dotenv()

class Config:
    NYSE_URL = "ftp://ftp.nasdaqtrader.com/symboldirectory/otherlisted.txt"
    NASDAQ_URL = 'https://www.nasdaqtrader.com/dynamic/symdir/nasdaqlisted.txt'
    DB_CONFIG = {
        'host': os.environ['DB_HOST'],
        'user': os.environ['DB_USER'],
        'password': os.environ['DB_PASSWORD'],
        'database': os.environ['DB_NAME'],
    }



def get_conn():
    return pymysql.connect(**Config.DB_CONFIG, cursorclass=pymysql.cursors.DictCursor)

def insert_tickers(conn, df, exchange):
    try:
        with conn.cursor() as cur:
            values = [(row['Symbol'], row['Security Name'], exchange) for _, row in df.iterrows()]
            cur.executemany(
                "INSERT IGNORE INTO market_stocks (ticker, name, exchange) VALUES (%s, %s, %s)",
                values    
            )
        conn.commit()
        print(f"[*] Inserted {cur.rowcount} tickers for {exchange}")
    except Exception as e:
        print(f"Error: {e}")
        conn.rollback()

def nyse_clean_data(df):
    df = df.copy()

    # Remove test listings
    df = df[df['Test Issue'] == 'N']

    # Create New Column with Just Company Name
    df['Company Name'] = df['Security Name'].apply(lambda x: x.split('-')[0])

    # Move 'Company Name' to 2nd Column
    cols = list(df.columns)
    cols.insert(1, cols.pop(-1))

    # Replacing df.ix with df.loc
    df = df.loc[:, cols]  # Using loc for label-based indexing

    return df


def get_nasdaq_tickers():
    try:
        res = requests.get(Config.NASDAQ_URL)
        data = res.text.split("\n")
        data = [row.split('|') for row in data]
        df = pd.DataFrame(data[1:], columns=data[0])

        df.columns = df.columns.str.replace('\r', '', regex=False)
        df = df.map(lambda x: x.replace('\r', '') if isinstance(x, str) else x)

        nasdaq = df[['Symbol', 'Security Name']]

        print(f"[*] Got {len(nasdaq)} NASDAQ items")
        return nasdaq
    except Exception as e:
        print(f"Error: {e}")

def get_nyse_tickers():
    try:
        other = pd.read_csv(Config.NYSE_URL, sep="|")

        other = nyse_clean_data(other)

        nyse = other[other['Exchange'] == 'N'][['ACT Symbol', 'Company Name']]
        nyse.columns = ['Symbol', 'Security Name']

        print(f"[*] Got {len(nyse)} NYSE items")
        return nyse
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    print(f"[*] Get Tickers...")
    nasdaq = get_nasdaq_tickers()
    nyse = get_nyse_tickers()

    print(f"[*] Connect to DB...")
    conn = get_conn()

    try:
        print(f"[*] Insert Ticker info...")
        exchange = [(nasdaq, 'nasdaq'), (nyse, 'nyse')]

        for e in exchange:
            insert_tickers(conn,e[0],e[1])
    finally:
        conn.close()