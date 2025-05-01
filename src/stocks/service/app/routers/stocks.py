from fastapi import APIRouter, HTTPException
from ..services.stock_data import fetch_stock_info, search_ticker
from ..services.market_status import MarketStatusService
from datetime import datetime
from pydantic import BaseModel

router = APIRouter(prefix="/api/stocks", tags=["Stocks"])

class StockData(BaseModel):
    query: str

# @router.get("/{symbol}")
# async def get_stock_data(symbol: str):
#     """
#     Return real-time data for a specific stock symbol
#     """
#     # Validate symbol (you can adjust the validation rules as needed)
#     if not symbol or len(symbol.strip()) == 0:
#         raise HTTPException(status_code=400, detail="Invalid symbol provided")
#     try:
#         stock_data = await fetch_stock_data(symbol)
        
#         # Handle case when no data is found
#         if stock_data is None:
#             raise HTTPException(
#                 status_code=404,
#                 detail=f"No data found for symbol: {symbol}"
#             )
            
#         return {"status":"success", "symbol": symbol, "data": stock_data}
        
#     except ValueError as ve:
#         raise HTTPException(
#             status_code=status.HTTP_429_TOO_MANY_REQUESTS if "API 제한" in str(ve)
#             else status.HTTP_400_BAD_REQUEST,
#             detail=str(ve)
#         )    
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Error fetching data: {str(e)}")

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
    # Implement logic to search for stocks based on symbol part
    # This could involve querying a database or an external API
    # For simplicity, let's assume we have a function that returns search results
    search_results = search_ticker(query)
    return search_results