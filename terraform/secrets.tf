# Secrets mapping from variables
locals {
  kie_api_key = var.kie_api_key

  cloudflare_api_key = var.cloudflare_api_key
  cloudflare_zone_id = var.cloudflare_zone_id
}
