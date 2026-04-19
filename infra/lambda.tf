data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../lambda"
  output_path = "${path.module}/lambda.zip"
}

resource "aws_lambda_function" "process_review" {
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "${var.project_name}-process-review"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "processReview.handler"
  runtime          = "nodejs20.x"
  timeout          = 300
  memory_size      = 512
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256

  environment {
    variables = {
      MONGODB_URI            = var.mongodb_uri
      OPENAI_API_KEY         = var.openai_api_key
      GITHUB_APP_ID          = var.github_app_id
      GITHUB_PRIVATE_KEY     = var.github_private_key
      AWS_SQS_QUEUE_URL      = aws_sqs_queue.reviews.url
    }
  }

  tags = { Project = var.project_name }
}

resource "aws_lambda_event_source_mapping" "sqs_trigger" {
  event_source_arn = aws_sqs_queue.reviews.arn
  function_name    = aws_lambda_function.process_review.arn
  batch_size       = 1
  enabled          = true
}

resource "aws_lambda_function" "webhook_receiver" {
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "${var.project_name}-webhook-receiver"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "webhookReceiver.handler"
  runtime          = "nodejs20.x"
  timeout          = 30
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256

  environment {
    variables = {
      GITHUB_WEBHOOK_SECRET = var.github_webhook_secret
      AWS_SQS_QUEUE_URL     = aws_sqs_queue.reviews.url
    }
  }

  tags = { Project = var.project_name }
}

resource "aws_lambda_function_url" "webhook" {
  function_name      = aws_lambda_function.webhook_receiver.function_name
  authorization_type = "NONE"
}

output "webhook_url" { value = aws_lambda_function_url.webhook.function_url }
