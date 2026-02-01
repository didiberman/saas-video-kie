# CNAME to Google's domain mapping endpoint.
# Cloud Run domain mapping handles SSL via Google-managed certificate.
resource "cloudflare_record" "saas_frontend" {
  zone_id = var.cloudflare_zone_id
  name    = "@" # vibeflow.video root
  content = "ghs.googlehosted.com"
  type    = "CNAME"
  proxied = false
}

resource "cloudflare_record" "legacy_frontend" {
  zone_id = var.legacy_cloudflare_zone_id
  name    = "saas" # saas.didiberman.com
  content = "ghs.googlehosted.com"
  type    = "CNAME"
  proxied = false
}
