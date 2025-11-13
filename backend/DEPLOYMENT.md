# GCE VM Deployment Guide

## Prerequisites

- Google Cloud SDK (gcloud) installed
- GCP project with billing enabled
- Appropriate IAM permissions

## Quick Start

### 1. Create VM Instance

```bash
gcloud compute instances create align-vm \
  --zone=asia-northeast3-a \
  --machine-type=e2-small \
  --image-family=ubuntu-2204-lts \
  --image-project=ubuntu-os-cloud \
  --boot-disk-size=20GB \
  --tags=http-server,https-server
```

**Machine Type Options:**
- `e2-micro` - 2 vCPU, 1GB RAM (~$7/month) - 테스트용
- `e2-small` - 2 vCPU, 2GB RAM (~$14/month) - 권장
- `e2-medium` - 2 vCPU, 4GB RAM (~$28/month) - 고성능

### 2. Configure Firewall

```bash
./setup-firewall.sh
```

### 3. Update Environment Variables

Edit `.env.production`:

```bash
# IMPORTANT: Change these values!
DB_PASSWORD=your-secure-password-here
JWT_SECRET=$(openssl rand -base64 32)
FRONTEND_URL=https://align-azure.vercel.app
GEMINI_API_KEY=your-actual-key
```

### 4. Deploy Application

```bash
./deploy-to-vm.sh
```

## Manual Deployment Steps

If the automated script doesn't work:

```bash
# 1. SSH into VM
gcloud compute ssh align-vm --zone=asia-northeast3-a

# 2. Install Docker (Ubuntu)
sudo apt-get update
sudo apt-get install -y docker.io docker-compose
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker $USER

# 3. Exit and reconnect
exit
gcloud compute ssh align-vm --zone=asia-northeast3-a

# 4. Upload files
cd ~
mkdir -p align-backend
exit

# From local machine
gcloud compute scp --recurse --zone=asia-northeast3-a \
  /Users/jihu/Desktop/Align/backend align-vm:~/align-backend

# 5. Start services
gcloud compute ssh align-vm --zone=asia-northeast3-a
cd ~/align-backend
docker-compose -f docker-compose.prod.yml up -d --build
```

## Verify Deployment

```bash
# Get VM IP
VM_IP=$(gcloud compute instances describe align-vm --zone=asia-northeast3-a --format='get(networkInterfaces[0].accessConfigs[0].natIP)')

# Test health endpoint
curl http://$VM_IP:8080/health

# Expected response:
# {"status":"ok","message":"Align Backend is running"}
```

## View Logs

```bash
gcloud compute ssh align-vm --zone=asia-northeast3-a --command='cd align-backend && docker-compose -f docker-compose.prod.yml logs -f'
```

## Update Application

To deploy updates:

```bash
./deploy-to-vm.sh
```

## Useful Commands

### Check VM Status
```bash
gcloud compute instances list
```

### Stop VM (to save costs)
```bash
gcloud compute instances stop align-vm --zone=asia-northeast3-a
```

### Start VM
```bash
gcloud compute instances start align-vm --zone=asia-northeast3-a
```

### Delete VM
```bash
gcloud compute instances delete align-vm --zone=asia-northeast3-a
```

### SSH into VM
```bash
gcloud compute ssh align-vm --zone=asia-northeast3-a
```

### Check Docker Status on VM
```bash
gcloud compute ssh align-vm --zone=asia-northeast3-a --command='docker ps'
```

### Database Backup
```bash
gcloud compute ssh align-vm --zone=asia-northeast3-a --command='
  cd align-backend
  docker-compose -f docker-compose.prod.yml exec -T db pg_dump -U align align > backup.sql
'
```

### Database Restore
```bash
gcloud compute ssh align-vm --zone=asia-northeast3-a --command='
  cd align-backend
  docker-compose -f docker-compose.prod.yml exec -T db psql -U align align < backup.sql
'
```

## Troubleshooting

### Container won't start
```bash
# Check logs
gcloud compute ssh align-vm --zone=asia-northeast3-a --command='
  cd align-backend
  docker-compose -f docker-compose.prod.yml logs
'
```

### Port 8080 not accessible
```bash
# Check firewall rules
gcloud compute firewall-rules list --filter="targetTags:http-server"

# Check if service is running
gcloud compute ssh align-vm --zone=asia-northeast3-a --command='
  curl http://localhost:8080/health
'
```

### Database connection issues
```bash
# Check database container
gcloud compute ssh align-vm --zone=asia-northeast3-a --command='
  cd align-backend
  docker-compose -f docker-compose.prod.yml exec db psql -U align -c "SELECT 1"
'
```

## Cost Estimation

- **e2-small VM**: ~$14/month
- **20GB Standard Disk**: ~$0.80/month
- **Network Egress**: ~$0.12/GB (첫 1GB 무료)

**Total**: ~$15-20/month

## Security Recommendations

1. ✅ Change default passwords in `.env.production`
2. ✅ Use strong JWT_SECRET
3. ⚠️ Consider restricting firewall to specific IPs
4. ⚠️ Enable HTTPS with Let's Encrypt
5. ⚠️ Set up automatic backups

## Next Steps

1. Set up domain name
2. Configure HTTPS with Certbot
3. Set up monitoring with Google Cloud Monitoring
4. Configure automatic backups
