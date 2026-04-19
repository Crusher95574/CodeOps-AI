variable "aws_region"       { default = "us-east-1" }
variable "project_name"     { default = "codeops-ai" }
variable "environment"      { default = "production" }
variable "mongodb_uri"      { sensitive = true }
variable "openai_api_key"   { sensitive = true }
variable "github_app_id"    {}
variable "github_private_key" { sensitive = true }
variable "github_webhook_secret" { sensitive = true }
variable "jwt_secret"       { sensitive = true }
