# Zip the function source code
data "archive_file" "start_generation_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../functions/start-generation"
  output_path = "${path.module}/dist/start-generation.zip"
}

data "archive_file" "webhook_handler_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../functions/webhook-handler"
  output_path = "${path.module}/dist/webhook-handler.zip"
}

# Storage bucket for function source
resource "google_storage_bucket" "function_bucket" {
  name                        = "${var.project_id}-gcf-source"
  location                    = var.region
  uniform_bucket_level_access = true
}

# Upload Zips
resource "google_storage_bucket_object" "start_generation_obj" {
  name   = "start-generation-${data.archive_file.start_generation_zip.output_md5}.zip"
  bucket = google_storage_bucket.function_bucket.name
  source = data.archive_file.start_generation_zip.output_path
}

resource "google_storage_bucket_object" "webhook_handler_obj" {
  name   = "webhook-handler-${data.archive_file.webhook_handler_zip.output_md5}.zip"
  bucket = google_storage_bucket.function_bucket.name
  source = data.archive_file.webhook_handler_zip.output_path
}

# Cloud Function: Start Generation
resource "google_cloudfunctions2_function" "start_generation" {
  name        = "start-generation"
  location    = var.region
  description = "Starts video generation via KIE AI"

  build_config {
    runtime     = "nodejs20"
    entry_point = "startGeneration"
    source {
      storage_source {
        bucket = google_storage_bucket.function_bucket.name
        object = google_storage_bucket_object.start_generation_obj.name
      }
    }
  }

  service_config {
    max_instance_count = 10
    available_memory   = "256M"
    timeout_seconds    = 60
    environment_variables = {
      SUPABASE_URL      = local.supabase_url
      SUPABASE_ANON_KEY = local.supabase_anon_key
      KIE_API_KEY       = local.kie_api_key
      WEBHOOK_URL       = google_cloudfunctions2_function.webhook_handler.service_config[0].uri
    }
  }
}

# Cloud Function: Webhook Handler
resource "google_cloudfunctions2_function" "webhook_handler" {
  name        = "webhook-handler"
  location    = var.region
  description = "Handles KIE AI callbacks"

  build_config {
    runtime     = "nodejs20"
    entry_point = "handleWebhook"
    source {
      storage_source {
        bucket = google_storage_bucket.function_bucket.name
        object = google_storage_bucket_object.webhook_handler_obj.name
      }
    }
  }

  service_config {
    max_instance_count = 10
    available_memory   = "256M"
    timeout_seconds    = 60
    environment_variables = {
      SUPABASE_URL              = local.supabase_url
      SUPABASE_SERVICE_ROLE_KEY = local.supabase_service_key
    }
  }
}

# Make Functions Public (or secure via IAM)
resource "google_cloud_run_service_iam_member" "public_start_gen" {
  service  = google_cloudfunctions2_function.start_generation.service_config[0].service
  location = var.region
  role     = "roles/run.invoker"
  member   = "allUsers" # TODO: Restrict to Frontend Service Account
}

resource "google_cloud_run_service_iam_member" "public_webhook" {
  service  = google_cloudfunctions2_function.webhook_handler.service_config[0].service
  location = var.region
  role     = "roles/run.invoker"
  member   = "allUsers" # Needs to be public for KIE AI callback
}
