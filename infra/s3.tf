resource "aws_s3_bucket" "diffs" {
  bucket = "${var.project_name}-diffs-${data.aws_caller_identity.current.account_id}"
  tags   = { Project = var.project_name }
}

resource "aws_s3_bucket_lifecycle_configuration" "diffs" {
  bucket = aws_s3_bucket.diffs.id
  rule {
    id     = "expire-old-diffs"
    status = "Enabled"
    expiration { days = 30 }
    filter {}
  }
}

data "aws_caller_identity" "current" {}
output "s3_bucket_name" { value = aws_s3_bucket.diffs.bucket }
