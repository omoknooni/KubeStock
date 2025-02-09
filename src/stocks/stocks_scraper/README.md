# Stock Ticker Scraper
Scrap US Stock Markets Ticker info from NASDAQ, NYSE  
Recommand to run once a day


## Installation
### DB Setting
Need to setting DB to save stock ticker info
Prefer to use .env.example as a DB Config setting
```
# .env
DB_HOST=
DB_USER=
DB_PASSWORD=
DB_NAME=
```

```sql
# DB Schema
CREATE TABLE IF NOT EXISTS market_stocks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticker VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    exchange VARCHAR(50),
);

```

### Python setting
```
pip install -r requirements.txt
python app.py
```

## Inspired from
[DataHub-NYSE](https://datahub.io/core/nyse-other-listings)  
[DataHub-NASDAQ](https://datahub.io/core/nasdaq-listings)