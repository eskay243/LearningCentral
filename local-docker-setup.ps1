# PowerShell Local Docker Setup with Demo Data Extraction
# For local PC Docker deployment with existing demo data

param(
    [switch]$Force = $false
)

$ErrorActionPreference = "Stop"

Write-Host "🖥️  Codelab Educare LMS - Local Docker Setup (PowerShell)" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

# Step 1: Check Docker availability
Write-Host "🐳 Step 1: Checking Docker Environment" -ForegroundColor Cyan
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Error "Docker not found. Please install Docker Desktop"
    exit 1
}

if (-not (Get-Command docker-compose -ErrorAction SilentlyContinue)) {
    Write-Error "docker-compose not found. Please install Docker Compose"
    exit 1
}

Write-Success "Docker environment ready"

# Step 2: Create local environment file
Write-Host "📋 Step 2: Setting up Local Environment" -ForegroundColor Cyan
if (-not (Test-Path ".env.local")) {
    $envContent = @"
# Local Docker Environment Configuration
NODE_ENV=production
PORT=5000

# Local PostgreSQL Database (Docker container)
DATABASE_URL=postgresql://postgres:postgres@db:5432/codelab_educare_lms
PGHOST=db
PGPORT=5432
PGUSER=postgres
PGPASSWORD=postgres
PGDATABASE=codelab_educare_lms

# Session Configuration
SESSION_SECRET=local-development-secret-key-change-in-production

# Payment Configuration (Test Keys)
PAYSTACK_SECRET_KEY=sk_test_your_test_key_here
PAYSTACK_PUBLIC_KEY=pk_test_your_test_key_here

# Local OAuth (Optional for local testing)
REPLIT_CLIENT_ID=local_client_id
REPLIT_CLIENT_SECRET=local_client_secret
OAUTH_CALLBACK_URL=http://localhost:5000/auth/callback
"@
    
    $envContent | Out-File -FilePath ".env.local" -Encoding UTF8
    Write-Success "Created .env.local configuration"
} else {
    Write-Success "Using existing .env.local configuration"
}

# Step 3: Extract current demo data
Write-Host "📥 Step 3: Extracting Current Demo Data" -ForegroundColor Cyan

# Create demo data directory
if (-not (Test-Path "demo-data")) {
    New-Item -ItemType Directory -Path "demo-data" | Out-Null
}

$demoDataExtracted = $false

# Check for current DATABASE_URL
if ($env:DATABASE_URL) {
    Write-Success "Extracting demo data from current database..."
    
    try {
        # Export current database data
        pg_dump $env:DATABASE_URL | Out-File -FilePath "demo-data/current_database.sql" -Encoding UTF8
        
        # Get counts for verification
        $userCount = (psql $env:DATABASE_URL -t -c "SELECT COUNT(*) FROM users;").Trim()
        $courseCount = (psql $env:DATABASE_URL -t -c "SELECT COUNT(*) FROM courses;").Trim()
        
        Write-Success "Extracted: $userCount users, $courseCount courses"
        $demoDataExtracted = $true
    } catch {
        Write-Warning "Failed to extract from current database: $($_.Exception.Message)"
    }
}

# Fallback to backup.sql if exists
if (-not $demoDataExtracted -and (Test-Path "backup.sql")) {
    Copy-Item "backup.sql" "demo-data/current_database.sql"
    Write-Success "Using backup.sql as demo data"
    $demoDataExtracted = $true
}

if (-not $demoDataExtracted) {
    Write-Warning "No existing data found. Will start with fresh database"
}

# Step 4: Copy file assets
Write-Host "📁 Step 4: Copying File Assets" -ForegroundColor Cyan
$assetsCopied = 0

if (Test-Path "uploads") {
    Copy-Item -Path "uploads" -Destination "demo-data/" -Recurse -Force
    $assetsCopied++
    Write-Success "Copied course uploads"
}

if (Test-Path "certificates") {
    Copy-Item -Path "certificates" -Destination "demo-data/" -Recurse -Force
    $assetsCopied++
    Write-Success "Copied certificates"
}

if (Test-Path "public/course-thumbnails") {
    if (-not (Test-Path "demo-data/course-thumbnails")) {
        New-Item -ItemType Directory -Path "demo-data/course-thumbnails" -Force | Out-Null
    }
    Copy-Item -Path "public/course-thumbnails/*" -Destination "demo-data/course-thumbnails/" -Recurse -Force -ErrorAction SilentlyContinue
    $assetsCopied++
    Write-Success "Copied course thumbnails"
}

Write-Success "Copied $assetsCopied asset directories"

# Step 5: Create Docker Compose for local setup
Write-Host "🐳 Step 5: Creating Local Docker Configuration" -ForegroundColor Cyan
$dockerComposeContent = @"
version: '3.8'

services:
  db:
    image: postgres:15-alpine
    container_name: codelab_db_local
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: codelab_educare_lms
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./demo-data:/docker-entrypoint-initdb.d
    ports:
      - "5432:5432"
    networks:
      - codelab_network

  app:
    build: .
    container_name: codelab_app_local
    env_file:
      - .env.local
    ports:
      - "5000:5000"
    volumes:
      - ./demo-data/uploads:/app/uploads
      - ./demo-data/certificates:/app/certificates
      - ./demo-data/course-thumbnails:/app/public/course-thumbnails
    depends_on:
      - db
    networks:
      - codelab_network
    restart: unless-stopped

volumes:
  postgres_data:

networks:
  codelab_network:
    driver: bridge
"@

$dockerComposeContent | Out-File -FilePath "docker-compose.local.yml" -Encoding UTF8
Write-Success "Created docker-compose.local.yml"

# Step 6: Start local Docker services
Write-Host "🚀 Step 6: Starting Local Docker Services" -ForegroundColor Cyan
Write-Success "Stopping any existing containers..."
docker-compose -f docker-compose.local.yml down 2>$null

Write-Success "Building and starting services..."
docker-compose -f docker-compose.local.yml up -d --build

# Step 7: Wait for services and import data
Write-Host "⏳ Step 7: Waiting for Services to Start" -ForegroundColor Cyan
Start-Sleep -Seconds 30

# Import demo data if available
if (Test-Path "demo-data/current_database.sql") {
    Write-Success "Importing demo data..."
    try {
        docker exec codelab_db_local psql -U postgres -d codelab_educare_lms -f /docker-entrypoint-initdb.d/current_database.sql
        Write-Success "Demo data imported successfully"
    } catch {
        Write-Warning "Demo data import failed: $($_.Exception.Message)"
    }
}

# Step 8: Verify deployment
Write-Host "🔍 Step 8: Verifying Local Deployment" -ForegroundColor Cyan
Start-Sleep -Seconds 10

# Health check
$healthCheckPassed = $false
for ($i = 1; $i -le 5; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5000/api/health" -UseBasicParsing -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Success "Health check passed"
            $healthCheckPassed = $true
            break
        }
    } catch {
        if ($i -eq 5) {
            Write-Error "Health check failed. Showing logs:"
            docker-compose -f docker-compose.local.yml logs app | Select-Object -Last 10
            exit 1
        } else {
            Write-Warning "Health check attempt $i failed, retrying..."
            Start-Sleep -Seconds 5
        }
    }
}

# Check database connection
try {
    $finalUserCount = (docker exec codelab_db_local psql -U postgres -d codelab_educare_lms -t -c "SELECT COUNT(*) FROM users;" 2>$null).Trim()
    if (-not $finalUserCount) { $finalUserCount = "0" }
} catch {
    $finalUserCount = "0"
}

Write-Host ""
Write-Host "🎉 LOCAL DOCKER SETUP COMPLETED!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "📊 System Status:"
Write-Host "- LMS URL: http://localhost:5000"
Write-Host "- Database: PostgreSQL (localhost:5432)"
Write-Host "- Users imported: $finalUserCount"
Write-Host "- File assets: $assetsCopied directories copied"
Write-Host ""
Write-Host "🔧 Management Commands:"
Write-Host "- View logs: docker-compose -f docker-compose.local.yml logs -f"
Write-Host "- Restart: docker-compose -f docker-compose.local.yml restart"
Write-Host "- Stop: docker-compose -f docker-compose.local.yml down"
Write-Host "- Database access: docker exec -it codelab_db_local psql -U postgres -d codelab_educare_lms"
Write-Host ""
Write-Host "📁 Demo Data Location:"
Write-Host "- Database: demo-data/current_database.sql"
Write-Host "- Files: demo-data/uploads, demo-data/certificates"
Write-Host ""
Write-Success "Your local Docker LMS is ready with all demo data!"