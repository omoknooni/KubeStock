# News SVC

## DB Setting
### ConfigMap Setting
```
kubectl create configmap db-init --from-file=./mysql/initdb.d/init.sql
```
### Secret Setting
```
kubectl create secret generic db-secret --from-env-file=/path/to/.env
```

## App Setting
### Secret setting
```
kubectl create secret generic news-secret --from-env-file=path/to/.env
```

```
# .env format
RSS_FEED_URL=
KO_RSS_FEED_URL=
DB_HOST=
DB_USER=
DB_PASSWORD=
DB_NAME=
DB_PORT=
```