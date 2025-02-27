output "cluster_name" {
  description = "Name of EKS cluster"
  value = module.eks.cluster_name
}
output "cluster_endpoint" {
  description = "Endpoint for EKS Control plane"
  value = module.eks.cluster_endpoint
}

output "cluster_sg_id" {
  description = "Security group id for cluster control plane"
  value = module.eks.cluster_security_group_id
}

output "cluster_ca" {
  description = "CA for cluster"
  value = module.eks.cluster_certificate_authority_data
}