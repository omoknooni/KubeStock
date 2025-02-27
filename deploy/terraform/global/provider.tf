terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
      version = "~> 5.5"
    }
  }
}

provider "aws" {
  region = "us-east-1"
  shared_config_files = [ "" ]
  shared_credentials_files = [ "" ]
}