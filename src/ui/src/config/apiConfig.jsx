const env = process.env.NODE_ENV || "dev"

const config = {
    dev: {
        stocksApiUrl: process.env.STOCKS_API_URL || "http://localhost:8000",
        backtestApiUrl: process.env.BACKTEST_API_URL || "http://localhost:8001",
    },
    prod: {
        stocksApiUrl: process.env.STOCKS_API_URL || "http://stocks",
        backtestApiUrl: process.env.BACKTEST_API_URL || "http://backtest",
    }
}

export default config[env]