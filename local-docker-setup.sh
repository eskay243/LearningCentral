#!/bin/bash
# Local Docker Setup with Demo Data Extraction
# For local PC Docker deployment with existing demo data

set -e

echo "🖥️  Codelab Educare LMS - Local Docker Setup"
echo "============================================="

# Function to print colored output
print_status() {
    echo "✅ $1"
}

print_warning() {
    echo "⚠️  $1"
}

print_error() {
    echo "❌ $1"
}

# Step 1: Check Docker availability
echo "🐳 Step 1: Checking Docker Environment"
if ! command -v docker &> /dev/null; then
    print_error "Docker not found. Please install Docker Desktop"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    print_error "docker-compose not found. Please install Docker Compose"
    exit 1
fi

print_status "Docker environment ready"

# Step 2: Create local environment file
echo "📋 Step 2: Setting up Local Environment"
if [ ! -f .env.local ]; then
    cat > .env.local << 'EOF'
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
EOF
    print_status "Created .env.local configuration"
else
    print_status "Using existing .env.local configuration"
fi

# Step 3: Create demo data extraction script
echo "📊 Step 3: Creating Demo Data Extraction Script"
cat > extract-demo-data.sql << 'EOF'
-- Demo Data Extraction Script
-- This script extracts current demo data for Docker import

\echo 'Extracting demo data from current database...'

-- Export users
\copy users TO '/tmp/demo_users.csv' WITH CSV HEADER;

-- Export courses
\copy courses TO '/tmp/demo_courses.csv' WITH CSV HEADER;

-- Export enrollments
\copy enrollments TO '/tmp/demo_enrollments.csv' WITH CSV HEADER;

-- Export messages
\copy messages TO '/tmp/demo_messages.csv' WITH CSV HEADER;

-- Export notifications
\copy notifications TO '/tmp/demo_notifications.csv' WITH CSV HEADER;

-- Export sessions
\copy sessions TO '/tmp/demo_sessions.csv' WITH CSV HEADER;

\echo 'Demo data extracted successfully!'
EOF

# Step 4: Extract current demo data
echo "📥 Step 4: Extracting Current Demo Data"
if [ -n "$DATABASE_URL" ]; then
    print_status "Extracting demo data from current database..."
    
    # Create demo data directory
    mkdir -p demo-data
    
    # Export current database data
    pg_dump "$DATABASE_URL" > demo-data/current_database.sql
    
    print_status "Demo data extracted to demo-data/current_database.sql"
    
    # Extract user count for verification
    USER_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM users;" | tr -d ' ')
    COURSE_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM courses;" | tr -d ' ')
    print_status "Extracted: $USER_COUNT users, $COURSE_COUNT courses"
else
    print_warning "No DATABASE_URL found. Checking for backup.sql..."
    if [ -f "backup.sql" ]; then
        cp backup.sql demo-data/current_database.sql
        print_status "Using backup.sql as demo data"
    else
        print_warning "No existing data found. Will start with fresh database"
    fi
fi

# Step 5: Copy file assets
echo "📁 Step 5: Copying File Assets"
ASSETS_COPIED=0

if [ -d "uploads" ]; then
    cp -r uploads demo-data/
    ASSETS_COPIED=$((ASSETS_COPIED + 1))
    print_status "Copied course uploads"
fi

if [ -d "certificates" ]; then
    cp -r certificates demo-data/
    ASSETS_COPIED=$((ASSETS_COPIED + 1))
    print_status "Copied certificates"
fi

if [ -d "public/course-thumbnails" ]; then
    mkdir -p demo-data/course-thumbnails
    cp -r public/course-thumbnails/* demo-data/course-thumbnails/ 2>/dev/null || true
    ASSETS_COPIED=$((ASSETS_COPIED + 1))
    print_status "Copied course thumbnails"
fi

print_status "Copied $ASSETS_COPIED asset directories"

# Step 6: Create Docker Compose for local setup
echo "🐳 Step 6: Creating Local Docker Configuration"
cat > docker-compose.local.yml << 'EOF'
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
EOF

print_status "Created docker-compose.local.yml"

# Step 7: Start local Docker services
echo "🚀 Step 7: Starting Local Docker Services"
print_status "Stopping any existing containers..."
docker-compose -f docker-compose.local.yml down &>/dev/null || true

print_status "Building and starting services..."
docker-compose -f docker-compose.local.yml up -d --build

# Step 8: Wait for services and import data
echo "⏳ Step 8: Waiting for Services to Start"
sleep 30

# Import demo data if available
if [ -f "demo-data/current_database.sql" ]; then
    print_status "Importing demo data..."
    docker exec codelab_db_local psql -U postgres -d codelab_educare_lms -f /docker-entrypoint-initdb.d/current_database.sql
    print_status "Demo data imported successfully"
fi

# Step 9: Verify deployment
echo "🔍 Step 9: Verifying Local Deployment"
sleep 10

# Health check
for i in {1..5}; do
    if curl -f http://localhost:5000/api/health &>/dev/null; then
        print_status "Health check passed"
        break
    else
        if [ $i -eq 5 ]; then
            print_error "Health check failed. Showing logs:"
            docker-compose -f docker-compose.local.yml logs app | tail -10
            exit 1
        else
            print_warning "Health check attempt $i failed, retrying..."
            sleep 5
        fi
    fi
done

# Check database connection
FINAL_USER_COUNT=$(docker exec codelab_db_local psql -U postgres -d codelab_educare_lms -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | tr -d ' ' || echo "0")

echo ""
echo "🎉 LOCAL DOCKER SETUP COMPLETED!"
echo "================================"
echo ""
echo "📊 System Status:"
echo "- LMS URL: http://localhost:5000"
echo "- Database: PostgreSQL (localhost:5432)"
echo "- Users imported: $FINAL_USER_COUNT"
echo "- File assets: $ASSETS_COPIED directories copied"
echo ""
echo "🔧 Management Commands:"
echo "- View logs: docker-compose -f docker-compose.local.yml logs -f"
echo "- Restart: docker-compose -f docker-compose.local.yml restart"
echo "- Stop: docker-compose -f docker-compose.local.yml down"
echo "- Database access: docker exec -it codelab_db_local psql -U postgres -d codelab_educare_lms"
echo ""
echo "📁 Demo Data Location:"
echo "- Database: demo-data/current_database.sql"
echo "- Files: demo-data/uploads, demo-data/certificates"
echo ""
print_status "Your local Docker LMS is ready with all demo data!"