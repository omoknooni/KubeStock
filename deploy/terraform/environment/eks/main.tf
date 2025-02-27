module "provider_config" {
  source = "../../global"
}

module "vpc" {
  source = "terraform-aws-modules/vpc/aws"
  version = "~> 5.19"

  name = var.vpc_name
  cidr = "10.0.0.0/16"

  azs = slice(data.aws_availability_zones.available.names, 0, 3)
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets = ["10.0.10.0/24", "10.0.11.0/24", "10.0.12.0/24"]
  
  tags = {
    Terraform = "true"
  }
}


module "eks" {
  source = "terraform-aws-modules/eks/aws"
  version = "~> 20.31"

  depends_on = [ module.vpc ]

  cluster_name = var.cluster_name
  cluster_version = "1.31"

  # cluster endpoint : EKS 클러스터의 쿠버네티스 API 서버에 접근하기 위한 엔드포인트
  # 어떻게 접근할 것인가를 지정하는 옵션
  # public: 워커노드와 API서버의 통신이 인터넷을 타고감
  # private/public&private: 워커노드와 API서버의 통신이 인터넷을 타지 않음 (VPC 간의 통신)

  cluster_endpoint_public_access = true

  vpc_id = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  eks_managed_node_group_defaults = {
    ami_type = "AL2023_x86_64_STANDARD"
  }
  eks_managed_node_groups = {
    one = {
        instance_types = ["t3.medium"]
        min_size = 1
        max_size = 3
        desired_size = 2
    }
  }

  tags = {
    Terraform = "true"
  }
}

data "aws_region" "current" {}

resource "terraform_data" "kubernetes_apply" {
  depends_on = [ module.eks ]
  provisioner "local-exec" {
    command = "aws eks update-kubeconfig --name ${module.eks.cluster_name} --region ${data.aws_region.current.name} && kubectl apply -f ../../../kubernetes"
  }

}