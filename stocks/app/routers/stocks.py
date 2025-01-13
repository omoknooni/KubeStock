from fastapi import APIRouter, HTTPException
from app.services.stock_data import fetch_stock_data, fetch_stock_info

router = APIRouter(prefix="/stocks", tags=["Stocks"])

@router.get("/{symbol}")
async def get_stock_data(symbol: str):
    """
    Return real-time data for a specific stock symbol
    """
    # Validate symbol (you can adjust the validation rules as needed)
    if not symbol or len(symbol.strip()) == 0:
        raise HTTPException(status_code=400, detail="Invalid symbol provided")

    try:
        stock_data = await fetch_stock_data(symbol)
        
        # Handle case when no data is found
        if stock_data is None:
            raise HTTPException(
                status_code=404,
                detail=f"No data found for symbol: {symbol}"
            )
            
        return {"symbol": symbol, "data": stock_data}
        
    except HTTPException:
        raise  # Re-raise HTTP exceptions as-is
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching data: {str(e)}")

@router.get("/{symbol}/info")
def get_stock_info(symbol: str):
    """
    Return stock information for a specific symbol
    """
    info = fetch_stock_info(symbol)
    return info