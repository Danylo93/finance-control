variable "aws_region" {
  description = "Região da AWS para deploy"
  type        = string
  default     = "us-east-1"
}

variable "db_username" {
  description = "Usuário do banco de dados RDS"
  type        = string
  default     = "postgres"
}

variable "db_password" {
  description = "Senha do banco de dados RDS"
  type        = string
  sensitive   = true
}
