const env = process.env.NODE_ENV

const config = {
    development: {
        stocksApiUrl: process.env.REACT_APP_STOCKS_API_URL || "http://localhost:8000",
        backtestApiUrl: process.env.REACT_APP_BACKTEST_API_URL || "http://localhost:8001",
        newsRssUrl: process.env.REACT_APP_NEWS_RSS_URL || "",
        newsApiUrl: process.env.REACT_APP_NEWS_API_URL || "http://localhost:8002"
    },
    production: {
        stocksApiUrl: process.env.REACT_APP_STOCKS_API_URL || "",
        backtestApiUrl: process.env.REACT_APP_BACKTEST_API_URL || "",
        newsRssUrl: process.env.REACT_APP_NEWS_RSS_URL || "",
        newsApiUrl: process.env.REACT_APP_NEWS_API_URL || ""
    }
}

export default config[env]