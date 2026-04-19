resource "aws_sqs_queue" "reviews_dlq" {
  name                      = "${var.project_name}-reviews-dlq"
  message_retention_seconds = 1209600
  tags = { Project = var.project_name }
}

resource "aws_sqs_queue" "reviews" {
  name                       = "${var.project_name}-reviews"
  visibility_timeout_seconds = 300
  message_retention_seconds  = 86400
  receive_wait_time_seconds  = 20

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.reviews_dlq.arn
    maxReceiveCount     = 3
  })

  tags = { Project = var.project_name }
}

output "sqs_queue_url" { value = aws_sqs_queue.reviews.url }
output "sqs_queue_arn" { value = aws_sqs_queue.reviews.arn }
