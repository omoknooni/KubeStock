# DB
DB for kubestock (stock ticker info, news info...)

## Setting
### ConfigMap setting
```
kubectl create configmap db-init --from-file=./mysql/initdb.d/init.sql
```

# Secret setting
Use .env.example files format
```
cp .env.example .env
kubectl create secret generic db-secret --from-env-file=path/to/.env
```