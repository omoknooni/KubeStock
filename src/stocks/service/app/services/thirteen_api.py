import pandas as pd
import os
import pymysql
from edgar import find_fund, set_identity
from dotenv import load_dotenv

load_dotenv()
EDGAR_USER = os.getenv("EDGAR_USER")
if EDGAR_USER:
    set_identity(EDGAR_USER)

DB_CONFIG = {
    "host": os.getenv("DB_HOST"),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "database": os.getenv("DB_NAME"),
}

def get_conn():
    return pymysql.connect(**DB_CONFIG, cursorclass=pymysql.cursors.DictCursor)

def fetch_filing_meta(cik: str):
    """
    최신 13F-HR 제출 메타정보를 dict로 반환
    """
    conn = get_conn()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT fi.filing_date, fi.report_date, fi.total_assets
                FROM filings fi
                JOIN funds fu ON fi.fund_id = fu.id
                WHERE fu.cik = %s
                ORDER BY fi.filing_date DESC
                LIMIT 1
                """, (cik,)
            )
            row = cursor.fetchone()
            if not row:
                raise ValueError(f"No filings found for CIK {cik}")
            return {
                "cik": cik,
                "filing_date": row["filing_date"].isoformat(),
                "report_date": row["report_date"].isoformat(),
                "total_assets": float(row["total_assets"])
            }
    finally:
        conn.close()

# 가장 최신 포트폴리오 fetch
def fetch_portfolio_overview(cik: str) -> dict:
    conn = get_conn()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT fi.id AS filing_id, fi.total_assets
                FROM filings fi
                JOIN funds fu ON fi.fund_id = fu.id
                WHERE fu.cik = %s
                ORDER BY fi.filing_date DESC
                LIMIT 1
                """, (cik,)
            )
            fil = cursor.fetchone()
            if not fil:
                raise ValueError(f"No filings found for CIK {cik}")
            filing_id = fil["filing_id"]
            total_assets = float(fil["total_assets"])

            # 분기별 종목 수, 총 금액
            cursor.execute(
                "SELECT COUNT(*) AS cnt, COALESCE(SUM(value),0) AS total "
                "FROM holdings WHERE filing_id = %s",
                (filing_id,)
            )
            summary = cursor.fetchone()

            # 분기별 종목 내용
            cursor.execute(
                """
                SELECT issuer, cusip, value, shares, holding_rate
                FROM holdings
                WHERE filing_id = %s
                ORDER BY value DESC
                """, (filing_id,)
            )
            holdings = cursor.fetchall()

            return {
                "cik": cik,
                "total_holdings_cnt": summary["cnt"],
                "total_value": float(summary["total"]),
                "holdings": [
                    {
                        "issuer": h["issuer"],
                        "cusip": h["cusip"],
                        "value": float(h["value"]),
                        "shares": int(h["shares"]),
                        "holding_rate": float(h["holding_rate"])
                    }
                    for h in holdings
                ]
            }
    finally:
        conn.close()

# 분기별 종목의 변화
def fetch_inout_changes(cik: str) -> dict:
    conn = get_conn()
    try:
        with conn.cursor() as cursor:
            # 가장 최근 2개의 filing id
            cursor.execute(
                """
                SELECT fi.id AS filing_id
                FROM filings fi
                JOIN funds fu ON fi.fund_id = fu.id
                WHERE fu.cik = %s
                ORDER BY fi.filing_date DESC
                LIMIT 2
                """, (cik,)
            )
            rows = cursor.fetchall()
            if len(rows) < 2:
                raise ValueError(f"Not enough filings to compare for CIK {cik}")

            current_id = rows[0]["filing_id"]
            prev_id = rows[1]["filing_id"]

            # 현재 분기(가장 최근)의 종목과 값
            cursor.execute("SELECT cusip, value FROM holdings WHERE filing_id = %s", (current_id,))
            current = {r["cusip"]: float(r["value"]) for r in cursor.fetchall()}

            # 이전 분기(가장 최근의 직전)의 종목과 값
            cursor.execute("SELECT cusip, value FROM holdings WHERE filing_id = %s", (prev_id,))
            previous = {r["cusip"]: float(r["value"]) for r in cursor.fetchall()}

            # 변동 내역 비교 (신규 편입/편출, 비중 변화)
            new_positions = list(set(current) - set(previous))
            exited_positions = list(set(previous) - set(current))
            changed = {}
            for cusip in set(current).intersection(previous):
                if current[cusip] != previous[cusip]:
                    rate = round((current[cusip] - previous[cusip]) / previous[cusip] * 100, 2) if previous[cusip] else 0.0
                    changed[cusip] = {
                        "previous": previous[cusip],
                        "current": current[cusip],
                        "rate_changed": rate
                    }

            return {"cik": cik, "new": new_positions, "exited": exited_positions, "changed": changed}
    finally:
        conn.close()