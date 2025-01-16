const env = process.env.NODE_ENV

const config = {
    development: {
        stocksApiUrl: process.env.REACT_APP_STOCKS_API_URL || "http://localhost:8000",
        backtestApiUrl: process.env.REACT_APP_BACKTEST_API_URL || "http://localhost:8001",
    },
    production: {
        stocksApiUrl: process.env.REACT_APP_STOCKS_API_URL || "http://stocks",
        backtestApiUrl: process.env.REACT_APP_BACKTEST_API_URL || "http://backtest",
    }
}

export default config[env]