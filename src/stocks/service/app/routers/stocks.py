from fastapi import APIRouter, HTTPException
from ..services.stock_data import fetch_stock_info, search_ticker
from ..services.market_status import MarketStatusService
from ..services.thirteen_api import fetch_filing_meta, fetch_inout_changes, fetch_portfolio_overview
from datetime import datetime
from pydantic import BaseModel

router = APIRouter(prefix="/api/stocks", tags=["Stocks"])

class StockData(BaseModel):
    query: str

class FilingMetaResponse(BaseModel):
    cik: str
    filing_date: str
    report_date: str
    total_assets: float

class Holding(BaseModel):
    issuer: str
    cusip: str
    value: float
    shares: int
    holding_rate: float

class PortfolioOverviewResponse(BaseModel):
    cik: str
    total_holdings_cnt: int
    total_value: float
    holdings: list[Holding]

@router.get("/{symbol}/info")
def get_stock_info(symbol: str):
    """
    Return stock information for a specific symbol
    """
    info = fetch_stock_info(symbol)
    return info

@router.get("/market-status")
def get_market_status():
    """
    Return market status
    Check cached data at first, and no data founded, call external API
    """
    try:
        market_service = MarketStatusService()
        status = market_service.get_market_status()
        return {"status": "success", "market_status": status,  "time": datetime.now().isoformat()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching market status: {str(e)}")
    
@router.post("/search")
def search_from_ticker(query: StockData):
    """
    Return stock's ticker and full name for a specific symbol part
    """
    search_results = search_ticker(query)
    return search_results

@router.get("/filing_meta/{cik}", response_model=FilingMetaResponse)
def get_filing_meta(cik: str):
    """
    Returns meta information for the latest 13F-HR filing of the given CIK
    """
    try:
        return fetch_filing_meta(cik)
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Error fetching filing meta: {str(e)}")
    
@router.get("/portfolio_overview/{cik}", response_model=PortfolioOverviewResponse)
def get_portfolio_overview(cik: str):
    """
    Returns portfolio overview for the latest 13F-HR filing of the given CIK
    """
    try:
        return fetch_portfolio_overview(cik)
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Error fetching portfolio overview: {str(e)}")
    
@router.get("/inout/{cik}")
def get_inout_changes(cik: str):
    """
    전 분기 대비 신규 편입/편출 종목 목록 반환
    """
    try:
        return fetch_inout_changes(cik)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))