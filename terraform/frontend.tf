resource "google_cloud_run_v2_service" "frontend" {
  name     = "video-saas-frontend"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    containers {
      image = "gcr.io/${var.project_id}/video-saas:latest" # Image must be built/pushed separately

      env {
        name  = "NEXT_PUBLIC_SUPABASE_URL"
        value = local.supabase_url
      }
      env {
        name  = "NEXT_PUBLIC_SUPABASE_ANON_KEY"
        value = local.supabase_anon_key
      }
      # Inject the Backend Function URL into the Frontend
      env {
        name  = "NEXT_PUBLIC_API_URL"
        value = google_cloudfunctions2_function.start_generation.service_config[0].uri
      }
      env {
        name  = "NEXT_PUBLIC_APP_URL"
        value = "https://${var.domain_name}"
      }
    }
    scaling {
      max_instance_count = 10
    }
  }
}

# Allow public access to frontend
resource "google_cloud_run_service_iam_member" "public_frontend" {
  service  = google_cloud_run_v2_service.frontend.name
  location = var.region
  role     = "roles/run.invoker"
  member   = "allUsers"
}
