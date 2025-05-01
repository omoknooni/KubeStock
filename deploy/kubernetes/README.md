# Kubernetes GitOps with Argo CD

이 프로젝트는 [Argo CD](https://argo-cd.readthedocs.io/en/stable/)를 사용하여 Kubernetes 애플리케이션을 GitOps 방식으로 관리합니다.  
`deploy/kubernetes/` 디렉토리는 각 서비스의 Kubernetes 리소스와 Argo CD Application 정의들을 포함합니다.

---

## 📂 디렉토리 구조

```
deploy/kubernetes/  
├── apps/ # App-of-Apps를 구성하는 Application 리소스들 
│ ├── root-app.yaml 
│ ├── backtest-app.yaml 
│ ├── news-app.yaml 
│ ├── stocks-app.yaml 
│ ├── ui-app.yaml 
│ ├── db-app.yaml 
│ └── configmaps-app.yaml 
├── backtest/ # backtest 서비스 리소스 
├── news/ # news 서비스 리소스 
├── stocks/ # stocks 서비스 리소스 
├── ui/ # 프론트엔드 서비스 리소스 
├── db/ # DB 배포 리소스 
├── configmaps/ # 공통 설정 리소스 
└── create-secret.sh # 시크릿 생성 스크립트 (수동 실행 또는 Job 변환 필요)
```

---

## App-of-Apps?

- **root-app.yaml**: Argo CD에서 최상위 Application이며, 모든 하위 서비스를 Application 리소스로 포함하는 구조
- **recurse: true**를 이용해 `apps/` 디렉토리의 모든 Application 정의를 자동으로 동기화
- 각 서비스는 자체 디렉토리에 정의된 `Deployment`, `Service`, `CronJob` 등의 리소스를 포함  
-> 각 서비스들에 접근권한을 부여하는 등 역할 분리가 가능해짐 

---

## 초기 구성 절차

1. **Argo CD 설치 (with Helm)**
   ```bash
    helm repo add argo https://argoproj.github.io/argo-helm

    kubectl create namespace argo

    # values.yaml : https://raw.githubusercontent.com/argoproj/argo-helm/main/charts/argo-cd/values.yaml

    helm install argocd argo/argo-cd -f values.yaml -n argo
   ```
2. **argoCD에 Repo 연결**

3. **Root App 등록**
    ```
    kubectl apply -f deploy/kubernetes/apps/root-app.yml -n argo
    ```

# Prometheus Monitoring
이 프로젝트는 Prometheus와 Grafana를 통해 각 서비스 별 Metric과 발생되는 로그들을 관리합니다.  
`kube-prometheus-stack`을 통해 Prometheus Operator, Prometheus, AlertManager, Grafana를 한번에 구축    
monitoring 네임스페이스 하위에 모니터링 관련 리소스를 관리  
## 초기 구성 절차
1. **Helm repo 추가 및 Namespace 생성**
   ```bash
   helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
   helm repo update

   kubectl create ns monitoring
   ```
2. **kube-prometheus-stack 설치 (with Helm)**
   ```
   helm install prometheus-stack prometheus-community/kube-prometheus-stack -n monitoring
   ```
3. **DB exporter 등록**  
DB 내역과 관련된 metric을 추출해오기 위한 mysqld-exporter를 구축
   ```bash
   helm install db-exporter prometheus-community/prometheus-mysql-exporter -n monitoring \
    --set mysql.user="USER HERE" \
    --set mysql.host="db.default.svc.cluster.local" \
    --set mysql.pass="PASSWD HERE" \
    --set mysql.port="3306"
   ```
4. **모니터링 Root App 등록**  
Root App 하위에 포함된 각 서비스별 ServiceMonitor와 DB ServiceMonitor 등록
   ```bash
   kubectl apply -f deploy/kubernetes/monitoring/monitoring-app.yml -n argo
   ```