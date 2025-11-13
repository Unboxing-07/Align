#!/bin/bash
set -e

echo "🔥 Setting up firewall rules for Align Backend..."

# Allow HTTP traffic (port 8080)
gcloud compute firewall-rules create allow-align-backend \
  --allow=tcp:8080 \
  --target-tags=http-server \
  --description="Allow traffic to Align Backend on port 8080" \
  --direction=INGRESS

# Allow HTTPS traffic (port 443) - for future use
gcloud compute firewall-rules create allow-https \
  --allow=tcp:443 \
  --target-tags=https-server \
  --description="Allow HTTPS traffic" \
  --direction=INGRESS \
  || echo "HTTPS rule may already exist"

echo "✅ Firewall rules configured!"
echo ""
echo "Verify rules:"
echo "  gcloud compute firewall-rules list --filter='name~align'"
