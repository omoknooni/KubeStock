# Deploy with Terraform

## EKS
Build EKS cluster with Terraform, EKS 배포가 되면 자동으로 kubernetes 리소스 manifest가 적용되도록 구성
```
cd environment/eks
terraform init

terraform plan -var-file=terraform.tfvars

terraform apply -var-file=terraform.tfvars
```

## Access to Cluster
Kubeconfig is required to access to Cluster
### 1. Use aws cli
```
aws eks update-kubeconfig --region [리전] --name [클러스터명]

# cli가 해당 클러스터 엔드포인트 정보를 가져와서 ~/.kube/config 파일을 업데이트
kubectl get nodes
```

### 2. Manual (terraform output)
terraform으로 eks 리소스 배포하면 output에 eks cluster endpoint 주소가 나옴
```
kubectl config set-cluster my-eks-cluster \
  --server=$(terraform output cluster_endpoint) \
  --certificate-authority=$(terraform output cluster_ca)

kubectl config set-context my-eks-cluster \
  --cluster=my-eks-cluster \
  --user=aws

kubectl config use-context my-eks-cluster
```