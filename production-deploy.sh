#!/bin/bash
# Production Deployment Script - Addresses all migration challenges
# Compatible with both Unix and PowerShell environments

set -e  # Exit on any error

echo "🚀 Codelab Educare LMS - Production Deployment"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Step 1: Environment Validation
echo "📋 Step 1: Validating Environment"
if [ ! -f .env.production ]; then
    print_error ".env.production file not found"
    echo "Creating template .env.production file..."
    
    cat > .env.production << 'EOF'
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
EOF
    
    print_warning "Created .env.production template"
    print_error "Please edit .env.production with your actual values and run this script again"
    exit 1
fi

# Load environment variables
export $(cat .env.production | xargs)
print_status "Environment variables loaded"

# Step 2: Validate Required Variables
echo "🔍 Step 2: Validating Required Configuration"
missing_vars=()

if [[ "$DATABASE_URL" == *"your-production-host"* ]]; then
    missing_vars+=("DATABASE_URL")
fi

if [[ "$DOMAIN" == "yourdomain.com" ]]; then
    missing_vars+=("DOMAIN")
fi

if [[ "$PAYSTACK_SECRET_KEY" == "sk_live_your_paystack_secret_key" ]]; then
    missing_vars+=("PAYSTACK_SECRET_KEY")
fi

if [ ${#missing_vars[@]} -ne 0 ]; then
    print_error "Please update these variables in .env.production:"
    for var in "${missing_vars[@]}"; do
        echo "  - $var"
    done
    exit 1
fi

print_status "All required variables configured"

# Step 3: Database Connection Test
echo "🗄️  Step 3: Testing Database Connection"
if command -v psql &> /dev/null; then
    if psql "$DATABASE_URL" -c "SELECT version();" &> /dev/null; then
        print_status "Database connection successful"
    else
        print_error "Cannot connect to database. Please check DATABASE_URL"
        exit 1
    fi
else
    print_warning "psql not found, skipping database test"
fi

# Step 4: Database Migration
echo "📊 Step 4: Database Migration"
if [ -f "backup.sql" ]; then
    print_warning "Found backup.sql - importing existing data"
    
    # PowerShell compatible database import
    if command -v powershell &> /dev/null; then
        print_warning "Using PowerShell for database import"
        powershell "Get-Content backup.sql | psql '$DATABASE_URL'"
    else
        psql -f backup.sql "$DATABASE_URL"
    fi
    
    print_status "Database import completed"
else
    print_warning "No backup.sql found - creating fresh database"
    
    # Ensure drizzle-kit is available
    if ! command -v npx &> /dev/null; then
        print_error "Node.js/npm not found. Please install Node.js"
        exit 1
    fi
    
    # Run database migration
    npx drizzle-kit push:pg --config=drizzle.config.ts
    print_status "Fresh database created"
fi

# Step 5: Verify Database Schema
echo "🔍 Step 5: Verifying Database Schema"
USER_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'users';" | tr -d ' ')

if [ "$USER_COUNT" -eq "1" ]; then
    print_status "Database schema verified"
    
    # Check for existing users
    EXISTING_USERS=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM users;" | tr -d ' ')
    if [ "$EXISTING_USERS" -gt "0" ]; then
        print_status "$EXISTING_USERS users found in database"
    else
        print_warning "No users found - you'll need to create admin user after deployment"
    fi
else
    print_error "Database schema validation failed"
    exit 1
fi

# Step 6: Docker Deployment
echo "🐳 Step 6: Starting Docker Services"
if command -v docker-compose &> /dev/null; then
    # Stop any existing services
    docker-compose down &> /dev/null || true
    
    # Start services with production environment
    docker-compose --env-file .env.production up -d
    print_status "Docker services started"
    
    # Wait for services to be ready
    echo "⏳ Waiting for services to start..."
    sleep 30
    
else
    print_error "docker-compose not found. Please install Docker"
    exit 1
fi

# Step 7: Health Check
echo "🔍 Step 7: Running Health Checks"
HEALTH_URL="http://localhost:$PORT/api/health"

for i in {1..5}; do
    if curl -f "$HEALTH_URL" &> /dev/null; then
        print_status "Health check passed"
        break
    else
        if [ $i -eq 5 ]; then
            print_error "Health check failed after 5 attempts"
            echo "📋 Showing application logs:"
            docker-compose logs app | tail -20
            exit 1
        else
            print_warning "Health check attempt $i failed, retrying..."
            sleep 10
        fi
    fi
done

# Step 8: SSL and Domain Check (if not localhost)
if [ "$DOMAIN" != "localhost" ] && [ "$DOMAIN" != "127.0.0.1" ]; then
    echo "🌐 Step 8: Domain and SSL Check"
    
    if command -v nslookup &> /dev/null; then
        if nslookup "$DOMAIN" &> /dev/null; then
            print_status "Domain $DOMAIN resolves correctly"
        else
            print_warning "Domain $DOMAIN doesn't resolve. Check DNS configuration"
        fi
    fi
    
    # Test HTTPS if SSL is configured
    if curl -f "https://$DOMAIN/api/health" &> /dev/null; then
        print_status "HTTPS endpoint working"
    else
        print_warning "HTTPS not working. Check SSL configuration"
    fi
fi

# Step 9: Final Instructions
echo ""
echo "🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!"
echo "====================================="
echo ""
echo "📋 Next Steps:"
echo "1. Access your LMS at: http://localhost:$PORT (or https://$DOMAIN)"
echo "2. Create admin user: http://localhost:$PORT/admin-setup"
echo "3. Login with OAuth and follow the admin setup process"
echo ""
echo "🔧 Management Commands:"
echo "- View logs: docker-compose logs -f app"
echo "- Restart services: docker-compose restart"
echo "- Stop services: docker-compose down"
echo ""
echo "📊 Database Status:"
echo "- Users in database: $EXISTING_USERS"
echo "- Database URL: ${DATABASE_URL}"
echo ""
echo "🚨 Important:"
if [ "$EXISTING_USERS" -eq "0" ]; then
    echo "- No users found. Create your first admin user at /admin-setup"
fi
echo "- Save your .env.production file securely"
echo "- Set up regular database backups"
echo ""
print_status "Codelab Educare LMS is ready for production use!"