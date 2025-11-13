#!/bin/bash
set -e

# Configuration
VM_NAME="align-vm"
ZONE="asia-northeast3-a"
PROJECT_DIR="/home/$(whoami)/align-backend"

echo "🚀 Deploying Align Backend to GCE VM..."

# Check if VM exists
if ! gcloud compute instances describe $VM_NAME --zone=$ZONE &> /dev/null; then
  echo "❌ VM '$VM_NAME' not found. Please create it first."
  exit 1
fi

# Install Docker on VM (for Ubuntu)
echo "📦 Installing Docker on VM..."
gcloud compute ssh $VM_NAME --zone=$ZONE --command='
  if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    sudo apt-get update
    sudo apt-get install -y docker.io docker-compose
    sudo systemctl enable docker
    sudo systemctl start docker
    sudo usermod -aG docker $USER
  else
    echo "Docker already installed"
  fi
'

# Create project directory
echo "📁 Creating project directory..."
gcloud compute ssh $VM_NAME --zone=$ZONE --command="mkdir -p $PROJECT_DIR"

# Copy files to VM
echo "📤 Uploading files..."
gcloud compute scp --recurse --zone=$ZONE \
  --exclude=".git" \
  --exclude="node_modules" \
  --exclude="dist" \
  . $VM_NAME:$PROJECT_DIR

# Start services
echo "🐳 Starting Docker Compose..."
gcloud compute ssh $VM_NAME --zone=$ZONE --command="
  cd $PROJECT_DIR
  docker-compose -f docker-compose.prod.yml down
  docker-compose -f docker-compose.prod.yml up -d --build
"

# Get VM IP
VM_IP=$(gcloud compute instances describe $VM_NAME --zone=$ZONE --format='get(networkInterfaces[0].accessConfigs[0].natIP)')

echo ""
echo "✅ Deployment complete!"
echo "🌐 Backend URL: http://$VM_IP:8080"
echo "🏥 Health Check: http://$VM_IP:8080/health"
echo ""
echo "📊 View logs:"
echo "   gcloud compute ssh $VM_NAME --zone=$ZONE --command='cd $PROJECT_DIR && docker-compose -f docker-compose.prod.yml logs -f'"
