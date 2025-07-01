#!/bin/bash
# Validation script for local Docker setup
# Checks if demo data extraction and Docker deployment worked correctly

echo "🔍 Validating Local Docker Setup"
echo "================================"

# Check if Docker containers are running
echo "📦 Checking Docker containers..."
if docker ps | grep -q "codelab_app_local"; then
    echo "✅ Application container running"
else
    echo "❌ Application container not running"
    exit 1
fi

if docker ps | grep -q "codelab_db_local"; then
    echo "✅ Database container running"
else
    echo "❌ Database container not running"
    exit 1
fi

# Check application health
echo "🩺 Checking application health..."
if curl -f http://localhost:5000/api/health &>/dev/null; then
    echo "✅ Application health check passed"
else
    echo "❌ Application health check failed"
    exit 1
fi

# Check database data
echo "📊 Checking database data..."
USER_COUNT=$(docker exec codelab_db_local psql -U postgres -d codelab_educare_lms -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | tr -d ' ')
COURSE_COUNT=$(docker exec codelab_db_local psql -U postgres -d codelab_educare_lms -t -c "SELECT COUNT(*) FROM courses;" 2>/dev/null | tr -d ' ')
MESSAGE_COUNT=$(docker exec codelab_db_local psql -U postgres -d codelab_educare_lms -t -c "SELECT COUNT(*) FROM messages;" 2>/dev/null | tr -d ' ')

echo "✅ Users in database: $USER_COUNT"
echo "✅ Courses in database: $COURSE_COUNT"
echo "✅ Messages in database: $MESSAGE_COUNT"

# Check for demo user
DEMO_USER=$(docker exec codelab_db_local psql -U postgres -d codelab_educare_lms -t -c "SELECT COUNT(*) FROM users WHERE id = 'demo-israel-123';" 2>/dev/null | tr -d ' ')
if [ "$DEMO_USER" = "1" ]; then
    echo "✅ Demo mentor user (demo-israel-123) found"
else
    echo "⚠️  Demo mentor user not found"
fi

# Check file assets
echo "📁 Checking file assets..."
if [ -d "demo-data/uploads" ]; then
    UPLOAD_COUNT=$(find demo-data/uploads -type f 2>/dev/null | wc -l)
    echo "✅ Upload files: $UPLOAD_COUNT"
else
    echo "⚠️  No upload files found"
fi

if [ -d "demo-data/certificates" ]; then
    CERT_COUNT=$(find demo-data/certificates -type f 2>/dev/null | wc -l)
    echo "✅ Certificate files: $CERT_COUNT"
else
    echo "⚠️  No certificate files found"
fi

# Test login endpoint
echo "🔐 Testing authentication..."
if curl -f http://localhost:5000/api/user &>/dev/null; then
    echo "✅ Authentication endpoint responding"
else
    echo "⚠️  Authentication endpoint not responding (normal if not logged in)"
fi

echo ""
echo "🎉 LOCAL DOCKER VALIDATION COMPLETE"
echo "==================================="
echo ""
echo "Access your LMS at: http://localhost:5000"
echo "Database data: $USER_COUNT users, $COURSE_COUNT courses, $MESSAGE_COUNT messages"
echo ""
echo "Management commands:"
echo "- View logs: docker-compose -f docker-compose.local.yml logs -f"
echo "- Stop: docker-compose -f docker-compose.local.yml down"
echo "- Restart: docker-compose -f docker-compose.local.yml restart"