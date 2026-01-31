# Get the custom domain mapping from Cloud Run (Manual mapping often req first, or use a CNAME)
# Cloud Run custom domains are tricky in TF. 
# Simplest approach: Create CNAME to the run.app URL for Cloudflare proxied setup.

resource "cloudflare_record" "saas_frontend" {
  zone_id = local.cloudflare_zone_id
  name    = "saas" # saas.didiberman.com
  value   = replace(google_cloud_run_v2_service.frontend.uri, "https://", "")
  type    = "CNAME"
  proxied = true
}
