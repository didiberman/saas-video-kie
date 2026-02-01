# Secrets Configuration

# 1. KIE API Key
resource "google_secret_manager_secret" "kie_api_key" {
  secret_id = "kie-api-key"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "kie_api_key" {
  secret      = google_secret_manager_secret.kie_api_key.id
  secret_data = var.kie_api_key
}

# 2. Cloudflare API Key
resource "google_secret_manager_secret" "cloudflare_api_key" {
  secret_id = "cloudflare-api-key"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "cloudflare_api_key" {
  secret      = google_secret_manager_secret.cloudflare_api_key.id
  secret_data = var.cloudflare_api_key
}

# 3. Kiesaas Service Account (Firebase)
resource "google_secret_manager_secret" "kiesaas_service_account" {
  secret_id = "kiesaas-service-account"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "kiesaas_service_account" {
  secret      = google_secret_manager_secret.kiesaas_service_account.id
  secret_data = var.kiesaas_service_account_json
}


# --- IAM Bindings ---
# Grant the Default Compute Service Account access to these secrets so Cloud Run/Functions can mount them.
# In a stricter setup, create a custom Service Account for the functions.

data "google_compute_default_service_account" "default" {
}

resource "google_secret_manager_secret_iam_member" "kie_api_key_access" {
  secret_id = google_secret_manager_secret.kie_api_key.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${data.google_compute_default_service_account.default.email}"
}

resource "google_secret_manager_secret_iam_member" "cloudflare_api_key_access" {
  secret_id = google_secret_manager_secret.cloudflare_api_key.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${data.google_compute_default_service_account.default.email}"
}

resource "google_secret_manager_secret_iam_member" "kiesaas_service_account_access" {
  secret_id = google_secret_manager_secret.kiesaas_service_account.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${data.google_compute_default_service_account.default.email}"
}
