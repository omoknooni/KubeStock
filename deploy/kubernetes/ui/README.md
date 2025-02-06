# UI SVC
## Installation
### Nginx Ingress Controller
```
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update
helm install nginx-ingerss ingress-nginx/ingress-nginx --set controller.publishService.enabled=true
```