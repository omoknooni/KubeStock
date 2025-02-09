# News SVC

## App Setting
### Secret setting
use .env.example file's format
```
cp .env.example .env
kubectl create secret generic news-secret --from-env-file=path/to/.env
```