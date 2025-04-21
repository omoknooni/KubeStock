# DB for kubestock
이 디렉토리는 Kubestock에서 사용할 DB를 클러스터내에 배포하기 위한 Kustomize overlay 구조로 설계  

개발환경(WSL+Docker Desktop)과 운영환경(EKS+RDS)에서 각각 다른 스토리지와 설정을 사용할 수 있도록 구성

## Setting
### .env 파일 생성
secret을 생성하기 전에 .env파일 생성 (.env.example 포맷을 사용가능)
```
DB_HOST=db                  # dev: 내부 DB service 이름 / prod: RDS endpoint
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=kubestock
```
### ConfigMap setting
```
kubectl apply -f configmaps/
```
### Secret setting
```
./create-secret.sh
```

## 배포
```
# dev 환경
kubectl apply -k deploy/kubernetes/db/overlays/dev

# prod 환경 배포 (외부 RDS 사용)
kubectl apply -k deploy/kubernetes/db/overlays/prod
```
