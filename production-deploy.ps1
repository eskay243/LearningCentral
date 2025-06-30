# PowerShell Production Deployment Script
# Compatible with Windows PowerShell and PowerShell Core

param(
    [switch]$Force = $false
)

# Set error action preference
$ErrorActionPreference = "Stop"

Write-Host "🚀 Codelab Educare LMS - Production Deployment (PowerShell)" -ForegroundColor Green
Write-Host "=============================================================" -ForegroundColor Green

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

# Step 1: Environment Validation
Write-Host "📋 Step 1: Validating Environment" -ForegroundColor Cyan

if (-not (Test-Path ".env.production")) {
    Write-Error ".env.production file not found"
    Write-Host "Creating template .env.production file..."
    
    $envTemplate = @"
# Production Environment Configuration
# Replace all placeholder values with your actual production values

# Database Configuration (REQUIRED)
DATABASE_URL=postgresql://username:password@your-production-host:5432/codelab_educare_lms
PGHOST=your-production-host
PGPORT=5432
PGUSER=username
PGPASSWORD=password
PGDATABASE=codelab_educare_lms

# Application Configuration
NODE_ENV=production
PORT=5000
SESSION_SECRET=generate-a-super-secure-random-string-here

# Domain & SSL (REQUIRED for production)
DOMAIN=yourdomain.com

# Payment Integration (REQUIRED)
PAYSTACK_SECRET_KEY=sk_live_your_paystack_secret_key
PAYSTACK_PUBLIC_KEY=pk_live_your_paystack_public_key

# OAuth Configuration (REQUIRED for admin setup)
REPLIT_CLIENT_ID=your_replit_client_id
REPLIT_CLIENT_SECRET=your_replit_client_secret
OAUTH_CALLBACK_URL=https://yourdomain.com/auth/callback
"@
    
    $envTemplate | Out-File -FilePath ".env.production" -Encoding UTF8
    Write-Warning "Created .env.production template"
    Write-Error "Please edit .env.production with your actual values and run this script again"
    exit 1
}

# Load environment variables
Write-Host "Loading environment variables..."
$envVars = @{}
Get-Content ".env.production" | ForEach-Object {
    if ($_ -match "^([^#][^=]+)=(.+)$") {
        $envVars[$matches[1]] = $matches[2]
        [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
    }
}
Write-Success "Environment variables loaded"

# Step 2: Validate Required Variables
Write-Host "🔍 Step 2: Validating Required Configuration" -ForegroundColor Cyan
$missingVars = @()

if ($envVars["DATABASE_URL"] -like "*your-production-host*") {
    $missingVars += "DATABASE_URL"
}

if ($envVars["DOMAIN"] -eq "yourdomain.com") {
    $missingVars += "DOMAIN"
}

if ($envVars["PAYSTACK_SECRET_KEY"] -eq "sk_live_your_paystack_secret_key") {
    $missingVars += "PAYSTACK_SECRET_KEY"
}

if ($missingVars.Count -gt 0) {
    Write-Error "Please update these variables in .env.production:"
    $missingVars | ForEach-Object { Write-Host "  - $_" }
    exit 1
}

Write-Success "All required variables configured"

# Step 3: Database Connection Test
Write-Host "🗄️  Step 3: Testing Database Connection" -ForegroundColor Cyan
if (Get-Command psql -ErrorAction SilentlyContinue) {
    try {
        $result = psql $envVars["DATABASE_URL"] -c "SELECT version();" 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Database connection successful"
        } else {
            Write-Error "Cannot connect to database. Please check DATABASE_URL"
            exit 1
        }
    } catch {
        Write-Error "Database connection failed: $($_.Exception.Message)"
        exit 1
    }
} else {
    Write-Warning "psql not found, skipping database test"
}

# Step 4: Database Migration
Write-Host "📊 Step 4: Database Migration" -ForegroundColor Cyan
if (Test-Path "backup.sql") {
    Write-Warning "Found backup.sql - importing existing data"
    
    try {
        Get-Content "backup.sql" | psql $envVars["DATABASE_URL"]
        Write-Success "Database import completed"
    } catch {
        Write-Error "Database import failed: $($_.Exception.Message)"
        exit 1
    }
} else {
    Write-Warning "No backup.sql found - creating fresh database"
    
    # Check for npm/npx
    if (-not (Get-Command npx -ErrorAction SilentlyContinue)) {
        Write-Error "Node.js/npm not found. Please install Node.js"
        exit 1
    }
    
    # Run database migration
    try {
        npx drizzle-kit push:pg --config=drizzle.config.ts
        Write-Success "Fresh database created"
    } catch {
        Write-Error "Database migration failed: $($_.Exception.Message)"
        exit 1
    }
}

# Step 5: Verify Database Schema
Write-Host "🔍 Step 5: Verifying Database Schema" -ForegroundColor Cyan
try {
    $userTableCount = psql $envVars["DATABASE_URL"] -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'users';"
    $userTableCount = $userTableCount.Trim()
    
    if ($userTableCount -eq "1") {
        Write-Success "Database schema verified"
        
        # Check for existing users
        $existingUsers = psql $envVars["DATABASE_URL"] -t -c "SELECT COUNT(*) FROM users;"
        $existingUsers = $existingUsers.Trim()
        
        if ([int]$existingUsers -gt 0) {
            Write-Success "$existingUsers users found in database"
        } else {
            Write-Warning "No users found - you'll need to create admin user after deployment"
        }
    } else {
        Write-Error "Database schema validation failed"
        exit 1
    }
} catch {
    Write-Error "Database verification failed: $($_.Exception.Message)"
    exit 1
}

# Step 6: Docker Deployment
Write-Host "🐳 Step 6: Starting Docker Services" -ForegroundColor Cyan
if (Get-Command docker-compose -ErrorAction SilentlyContinue) {
    # Stop any existing services
    try {
        docker-compose down 2>$null
    } catch {
        # Ignore errors if no services are running
    }
    
    # Start services with production environment
    try {
        docker-compose --env-file .env.production up -d
        Write-Success "Docker services started"
        
        # Wait for services to be ready
        Write-Host "⏳ Waiting for services to start..."
        Start-Sleep -Seconds 30
    } catch {
        Write-Error "Docker deployment failed: $($_.Exception.Message)"
        exit 1
    }
} else {
    Write-Error "docker-compose not found. Please install Docker"
    exit 1
}

# Step 7: Health Check
Write-Host "🔍 Step 7: Running Health Checks" -ForegroundColor Cyan
$healthUrl = "http://localhost:$($envVars['PORT'])/api/health"

$healthCheckPassed = $false
for ($i = 1; $i -le 5; $i++) {
    try {
        $response = Invoke-WebRequest -Uri $healthUrl -UseBasicParsing -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Success "Health check passed"
            $healthCheckPassed = $true
            break
        }
    } catch {
        if ($i -eq 5) {
            Write-Error "Health check failed after 5 attempts"
            Write-Host "📋 Showing application logs:"
            docker-compose logs app | Select-Object -Last 20
            exit 1
        } else {
            Write-Warning "Health check attempt $i failed, retrying..."
            Start-Sleep -Seconds 10
        }
    }
}

# Step 8: Domain Check (if not localhost)
if ($envVars["DOMAIN"] -ne "localhost" -and $envVars["DOMAIN"] -ne "127.0.0.1") {
    Write-Host "🌐 Step 8: Domain Check" -ForegroundColor Cyan
    
    try {
        $dnsResult = Resolve-DnsName $envVars["DOMAIN"] -ErrorAction SilentlyContinue
        if ($dnsResult) {
            Write-Success "Domain $($envVars['DOMAIN']) resolves correctly"
        } else {
            Write-Warning "Domain $($envVars['DOMAIN']) doesn't resolve. Check DNS configuration"
        }
    } catch {
        Write-Warning "DNS check failed: $($_.Exception.Message)"
    }
    
    # Test HTTPS if SSL is configured
    try {
        $httpsUrl = "https://$($envVars['DOMAIN'])/api/health"
        $httpsResponse = Invoke-WebRequest -Uri $httpsUrl -UseBasicParsing -TimeoutSec 10
        if ($httpsResponse.StatusCode -eq 200) {
            Write-Success "HTTPS endpoint working"
        }
    } catch {
        Write-Warning "HTTPS not working. Check SSL configuration"
    }
}

# Final Instructions
Write-Host ""
Write-Host "🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps:"
Write-Host "1. Access your LMS at: http://localhost:$($envVars['PORT']) $(if ($envVars['DOMAIN'] -ne 'yourdomain.com') { "(or https://$($envVars['DOMAIN']))" })"
Write-Host "2. Create admin user: http://localhost:$($envVars['PORT'])/admin-setup"
Write-Host "3. Login with OAuth and follow the admin setup process"
Write-Host ""
Write-Host "🔧 Management Commands:"
Write-Host "- View logs: docker-compose logs -f app"
Write-Host "- Restart services: docker-compose restart"
Write-Host "- Stop services: docker-compose down"
Write-Host ""
Write-Host "📊 Database Status:"
Write-Host "- Users in database: $existingUsers"
Write-Host "- Database URL: $($envVars['DATABASE_URL'])"
Write-Host ""
Write-Host "🚨 Important:"
if ([int]$existingUsers -eq 0) {
    Write-Host "- No users found. Create your first admin user at /admin-setup"
}
Write-Host "- Save your .env.production file securely"
Write-Host "- Set up regular database backups"
Write-Host ""
Write-Success "Codelab Educare LMS is ready for production use!"