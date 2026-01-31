# Secrets mapping from variables
# This file maintains the 'local' interface used by other resources (secrets.tf, functions.tf)
locals {
  kie_api_key = var.kie_api_key

  cloudflare_api_key = var.cloudflare_api_key
  cloudflare_zone_id = var.cloudflare_zone_id

  supabase_url         = var.supabase_url
  supabase_anon_key    = var.supabase_anon_key
  supabase_service_key = var.supabase_service_role_key
}
