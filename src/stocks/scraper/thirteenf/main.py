from edgar import *
import pandas as pd
import pymysql
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    DB_CONFIG = {
        'host': os.environ['DB_HOST'],
        'user': os.environ['DB_USER'],
        'password': os.environ['DB_PASSWORD'],
        'database': os.environ['DB_NAME'],
    }

EDGAR_USER = os.getenv("EDGAR_USER")
if EDGAR_USER:
    set_identity(EDGAR_USER)

def require_edgar_user(func):
    def wrapper(*args, **kwargs):
        if not EDGAR_USER:
            raise RuntimeError("EDGAR_USER environment var is not set")
        return func(*args, **kwargs)
    return wrapper

@require_edgar_user
def _fetch_latest_13f_obj(cik:str):
    """
    최신 13F-HR 리포트 객체 반환
    """
    filings = find_fund(cik).get_filings(form="13F-HR")
    return filings.latest().obj()

@require_edgar_user
def _fetch_13f_df(cik: str) -> pd.DataFrame:
    """
    최신 13F-HR 리포트 DataFrame 반환
    """

    obj = _fetch_latest_13f_obj(cik)
    return obj.infotable

@require_edgar_user
def fetch_filing_meta(cik: str):
    """
    최신 13F-HR 제출 메타정보를 dict로 반환
    """
    obj = _fetch_latest_13f_obj(cik)
    
    return {
        "cik": cik,
        "filing_date": obj.filing_date,
        "report_date": obj.report_period,
        "total_assets": int(obj.total_value)
    }

def check_connectivity():
    """
    DB connection check
    """
    try:
        conn = pymysql.connect(**Config.DB_CONFIG)
        with conn.cursor() as c:
            c.execute("SELECT 1")
        return True, conn
    except pymysql.Error as e:
        print(f"[!] DB Connection Error: {e}")
        return False, None

# 기본적으로 DB의 funds 테이블에 존재하는 cik들만 스크래핑하긴 함
ALLOWED_CIKS = (
    "0001067983",   # 버크셔
    "0001166559",   # 빌게이츠
    "0001536411",   # 드러켄 밀러
    "0001697748",   # 캐시우드
)

def load_funds(conn):
    try:
        fmt = ','.join('%s' for _ in ALLOWED_CIKS)
        sql = f"SELECT id, cik FROM funds WHERE cik IN ({fmt})"
        with conn.cursor() as c:
            c.execute(sql, ALLOWED_CIKS)
            funds = c.fetchall()
        return funds
    except pymysql.Error as e:
        print(f"[!] DB Connection Error: {e}")
        return []

def upsert_filing(conn, fund_id: int, filing_date: str, report_date: str, total_assets: float) -> int:
    """
    Insert a filing record if not exists and return its id
    """
    with conn.cursor() as cursor:
        insert_sql = (
            "INSERT IGNORE INTO filings "
            "(fund_id, filing_date, report_date, total_assets) "
            "VALUES (%s, %s, %s, %s);"
        )
        cursor.execute(insert_sql, (fund_id, filing_date, report_date, total_assets))
        conn.commit()
        cursor.execute(
            "SELECT id FROM filings WHERE fund_id=%s AND filing_date=%s;",
            (fund_id, filing_date)
        )
        result = cursor.fetchone()
        return result['id']


def insert_holdings(conn, filing_id: int, rows: list):
    """
    Bulk insert holdings for a filing, ignoring duplicates
    """
    if not rows:
        return
    with conn.cursor() as cursor:
        insert_sql = (
            "INSERT IGNORE INTO holdings "
            "(filing_id, issuer, cusip, value, shares, share_type, holding_rate) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s);"
        )
        cursor.executemany(insert_sql, rows)
    conn.commit()


def run():
    print("[*] Running 13F scraper...")
    is_connected, conn = check_connectivity()
    if not is_connected:
        print("[!] DB Connection Failed")
        return
    
    try:
        print("[*] Loading CIKs...")
        funds = load_funds(conn)
        if not funds:
            print("[!] No funds registered in database.")
            return

        for fund in funds:
            fund_id = fund['id']
            cik = fund['cik']
            try:
                meta = fetch_filing_meta(cik)
                filing_id = upsert_filing(
                    conn,
                    fund_id,
                    meta['filing_date'],
                    meta['report_date'],
                    meta['total_assets']
                )
                df = _fetch_13f_df(cik)
                df = df.sort_values("Value", ascending=False)
                rows = []
                total_assets = meta['total_assets']
                for _, row in df.iterrows():
                    issuer = row.get("Issuer") or None
                    cusip = row.get("Cusip")
                    value = int(row.get("Value") or 0)
                    shares = int(row.get("SharesPrnAmount") or 0)
                    share_type = row.get("Type") or None
                    holding_rate = round((value / total_assets * 100), 2) if total_assets else 0.0
                    rows.append((filing_id, issuer, cusip, value, shares, share_type, holding_rate))

                insert_holdings(conn, filing_id, rows)
                print(f"[+] CIK={cik}: Loaded {len(rows)} holdings for filing {meta['filing_date']}")
            except Exception as err:
                print(f"[!] Error processing CIK={cik}: {err}")
    finally:
        conn.close()
        print("[*] 13F scraping job completed.")
