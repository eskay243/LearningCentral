#!/bin/bash

# Codelab Educare LMS Production Startup Script
set -e

echo "=== Codelab Educare LMS Production Startup ==="
echo "Starting at: $(date)"

# Environment check
if [ ! -f ".env.production" ]; then
    echo "ERROR: .env.production file not found!"
    echo "Please copy .env.example to .env.production and configure your production environment."
    exit 1
fi

# Check required environment variables
source .env.production

REQUIRED_VARS=(
    "DATABASE_URL"
    "SESSION_SECRET"
    "PAYSTACK_SECRET_KEY"
    "PAYSTACK_PUBLIC_KEY"
    "OAUTH_CLIENT_ID"
    "OAUTH_CLIENT_SECRET"
)

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo "ERROR: Required environment variable $var is not set!"
        exit 1
    fi
done

echo "✓ Environment variables validated"

# Create necessary directories
mkdir -p uploads/message-attachments
mkdir -p uploads/course-thumbnails
mkdir -p uploads/assignments
mkdir -p logs

echo "✓ Directories created"

# Start application
echo "Starting application containers..."
docker-compose --env-file .env.production up -d

# Wait for application to be ready
echo "Waiting for application to start..."
for i in {1..30}; do
    if curl -f -s http://localhost:5000/api/health >/dev/null 2>&1; then
        echo "✓ Application is healthy"
        break
    fi
    
    if [ $i -eq 30 ]; then
        echo "ERROR: Application failed to start within 30 seconds"
        echo "Check logs with: docker-compose logs app"
        exit 1
    fi
    
    echo "Waiting... ($i/30)"
    sleep 1
done

# Display application status
echo ""
echo "=== Application Status ==="
docker-compose ps
echo ""

# Display access information
echo "=== Access Information ==="
echo "Application URL: http://localhost:5000"
echo "Health Check: http://localhost:5000/api/health"
echo ""

echo "=== Production startup completed successfully at $(date) ==="