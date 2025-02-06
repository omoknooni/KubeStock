# Stock SVC
## App Setting
### Secret setting
```
kubectl create secret generic stocks-secret --from-env-file=path/to/.env
```

### .env format
use .env.example file's format
```
REDIS_HOST=
STOCK_API_KEY=
MARKET_API_KEY
```