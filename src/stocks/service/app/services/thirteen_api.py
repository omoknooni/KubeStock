import pandas as pd
import os
from edgar import find_fund, set_identity
from dotenv import load_dotenv

load_dotenv()
EDGAR_USER = os.getenv("EDGAR_USER")
if EDGAR_USER:
    set_identity(EDGAR_USER)

def _require_edgar_user(func):
    def wrapper(*args, **kwargs):
        if not EDGAR_USER:
            return {"error": "EDGAR_USER environment var is not set"}
        return func(*args, **kwargs)
    return wrapper

@_require_edgar_user
def _fetch_latest_13f_obj(cik:str):
    """
    최신 13F-HR 리포트 객체 반환
    """
    filings = find_fund(cik).get_filings(form="13F-HR")
    obj = filings.latest().obj()
    return obj

@_require_edgar_user
def _fetch_13f_df(cik: str) -> pd.DataFrame:
    """
    최신 13F-HR 리포트 DataFrame 반환
    """

    obj = _fetch_latest_13f_obj(cik)
    df = obj.infotable
    return df

@_require_edgar_user
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

@_require_edgar_user
def fetch_portfolio_overview(cik: str):
    """
    최신 13F 보유 종목 개요를 dict로 반환
    """
    df = _fetch_13f_df(cik)
    df = df.sort_values("Value", ascending=False)
    meta = fetch_filing_meta(cik)
    total_value = meta.get("total_assets",0)

    holdings = []
    # 갯수제한? => 특정 cik는 3000개 이상 종목이 있음
    for _, row in df.iterrows():
        holdings.append({
            "issuer": row.get("Issuer"),
            "cusip": row.get("Cusip"),
            "value": row.get("Value"),
            "shares": int(row.get("SharesPrnAmount")),
            "holding_rate": round(row.get("Value") / total_value * 100, 2)
        })
    return {
        "cik": cik,
        "total_holdings_cnt": len(holdings),
        "total_value": total_value,
        "holdings": holdings
    }

@_require_edgar_user
def fetch_inout_changes(cik: str):
    """
    최신 두 개 리포트를 비교해 신규 편입/완전 청산 종목을 dict로 반환
    """
    recent_filings = find_fund(cik).get_filings(form="13F-HR").latest(2)
    if len(recent_filings) < 2:
        raise ValueError("Not enough report")
    
    current = recent_filings[0].obj().infotable
    previous = recent_filings[1].obj().infotable

    current.set_index("Cusip", inplace=True)
    previous.set_index("Cusip", inplace=True)

    # 신규편입 / 편출된 종목
    new_positions = current.index.difference(previous.index).tolist()
    exited_positions = previous.index.difference(current.index).tolist()

    # 종목의 비중 변경 탐색
    changed = {}
    for cusip in current.index.intersection(previous.index):
        current_values = current.loc[cusip].get("Value")
        previous_values = previous.loc[cusip].get("Value")
        if current_values != previous_values:
            changed[cusip] = {
                "previous": int(previous_values),
                "current": int(current_values),
                "rate_changed": int((current_values - previous_values) / previous_values * 100)
            }

    return {
        "cik": cik,
        "new": list(new_positions),
        "exited": list(exited_positions),
        "changed": changed
    }
