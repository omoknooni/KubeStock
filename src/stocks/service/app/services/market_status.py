from datetime import datetime
from typing import Optional, Dict
from dotenv import load_dotenv
import requests
import os
import redis
import json
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('uvicorn.error')

class MarketStatusService:
    def __init__(self):
        load_dotenv()
        
        self.api_url = "https://api.polygon.io/v1/marketstatus/now"
        self.api_key = os.getenv("MARKET_API_KEY")
        self.cache_expiry = 300  # 5 minutes in seconds
        
        if not self.api_key:
            raise ValueError("MARKET_API_KEY environment variable is not set")
            
        try:
            self.redis_client = redis.Redis(
                host=os.getenv("REDIS_HOST", "localhost"),
                port=int(os.getenv("REDIS_PORT", 6379)),
                db=int(os.getenv("REDIS_DB", 0)),
                decode_responses=True
            )
        except redis.ConnectionError as e:
            logger.error(f"Failed to connect to Redis: {e}")
            raise

    def fetch_from_api(self) -> Optional[str]:
        """Fetch market status from external API."""
        try:
            response = requests.get(
                self.api_url,
                params={"apikey": self.api_key},
                timeout=10
            )
            response.raise_for_status()
            return response.json().get('market')
            
        except requests.RequestException as e:
            logger.error(f"API request failed: {e}")
            return None

    def get_cached_status(self) -> Optional[str]:
        """Retrieve market status from cache."""
        try:
            return self.redis_client.get("market_status")
        except redis.RedisError as e:
            logger.error(f"Redis operation failed: {e}")
            return None

    def update_cache(self, status: str) -> bool:
        """Update the cache with new market status."""
        try:
            return bool(self.redis_client.setex(
                "market_status",
                self.cache_expiry,
                status
            ))
        except redis.RedisError as e:
            logger.error(f"Failed to update cache: {e}")
            return False

    def get_market_status(self) -> Dict[str, Optional[str]]:
        """Get market status from cache or API."""
        # Try to get from cache first
        cached_status = self.get_cached_status()
        if cached_status:
            logger.info("Retrieved market status from cache")
            return cached_status

        # If not in cache, fetch from API
        api_status = self.fetch_from_api()
        if api_status:
            # Update cache with new data
            if self.update_cache(api_status):
                logger.info("Updated cache with new market status")
            return api_status

        logger.warning("Failed to get market status from both cache and API")
        return None
