output "cognito_user_pool_id" {
  value       = aws_cognito_user_pool.pool.id
  description = "O ID do User Pool no Cognito"
}

output "cognito_client_id" {
  value       = aws_cognito_user_pool_client.client.id
  description = "O Client ID da aplicação no Cognito"
}

output "rds_endpoint" {
  value       = aws_db_instance.postgres.endpoint
  description = "O endpoint do banco de dados RDS"
}
