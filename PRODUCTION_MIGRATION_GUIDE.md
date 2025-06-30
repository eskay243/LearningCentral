# Production Migration & Deployment Guide
## Addressing Current Challenges

Based on your feedback, here's a comprehensive solution to resolve the migration challenges:

## 1. Database Migration Solution

### Automated Migration Setup
```bash
# Create migration script that handles empty databases
#!/bin/bash
echo "Setting up production database..."

# Check if drizzle-kit is available
if ! command -v drizzle-kit &> /dev/null; then
    echo "Installing drizzle-kit..."
    npm install -g drizzle-kit
fi

# Run database migration
echo "Running database migrations..."
npm run db:push

# Verify migration
echo "Verifying database setup..."
psql $DATABASE_URL -c "\dt" > /tmp/tables.txt
if grep -q "users" /tmp/tables.txt; then
    echo "✅ Database migration successful"
else
    echo "❌ Database migration failed"
    exit 1
fi
```

### Alternative: Direct SQL Migration
```bash
# For PowerShell compatibility
psql -f migrations/schema.sql $DATABASE_URL
# OR
Get-Content migrations/schema.sql | psql $DATABASE_URL
```

## 2. Production Environment Setup

### Complete .env.production Template
```env
# Database Configuration
DATABASE_URL=postgresql://username:password@your-production-host:5432/codelab_educare_lms
PGHOST=your-production-host
PGPORT=5432
PGUSER=username
PGPASSWORD=password
PGDATABASE=codelab_educare_lms

# Application Configuration
NODE_ENV=production
PORT=5000
SESSION_SECRET=your-super-secure-session-secret-here

# Domain & SSL
DOMAIN=yourdomain.com
SSL_CERT_PATH=/etc/ssl/certs/yourdomain.crt
SSL_KEY_PATH=/etc/ssl/private/yourdomain.key

# Payment Integration
PAYSTACK_SECRET_KEY=sk_live_your_paystack_secret_key
PAYSTACK_PUBLIC_KEY=pk_live_your_paystack_public_key

# Email Configuration (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# OAuth Configuration
REPLIT_CLIENT_ID=your_replit_client_id
REPLIT_CLIENT_SECRET=your_replit_client_secret
OAUTH_CALLBACK_URL=https://yourdomain.com/auth/callback
```

## 3. Simplified Production Deployment

### Single Command Deployment
```bash
#!/bin/bash
# production-deploy.sh

set -e  # Exit on any error

echo "🚀 Starting Production Deployment..."

# Step 1: Environment Check
if [ ! -f .env.production ]; then
    echo "❌ .env.production file not found"
    echo "Please create .env.production with your production values"
    exit 1
fi

# Step 2: Database Setup
echo "📊 Setting up database..."
export $(cat .env.production | xargs)
npm run db:push

# Step 3: Create Admin User
echo "👤 Setting up admin user..."
echo "After deployment, visit: https://$DOMAIN/admin-setup"
echo "Use your OAuth login to create the first admin"

# Step 4: Start Services
echo "🐳 Starting Docker services..."
docker-compose --env-file .env.production up -d

# Step 5: Health Check
echo "🔍 Running health checks..."
sleep 30
curl -f http://localhost:5000/api/health || {
    echo "❌ Health check failed"
    docker-compose logs app
    exit 1
}

echo "✅ Deployment successful!"
echo "🌐 Access your LMS at: https://$DOMAIN"
echo "⚙️  Admin setup: https://$DOMAIN/admin-setup"
```

## 4. Database Import Solution

### Automated Database Import
```bash
#!/bin/bash
# import-database.sh

echo "📊 Importing database..."

if [ -f "backup.sql" ]; then
    echo "Found backup.sql, importing..."
    
    # PowerShell compatible version
    if command -v powershell &> /dev/null; then
        powershell "Get-Content backup.sql | psql $DATABASE_URL"
    else
        psql -f backup.sql $DATABASE_URL
    fi
    
    echo "✅ Database import completed"
else
    echo "No backup.sql found, starting with fresh database"
    npm run db:push
fi

# Verify import
echo "Verifying data..."
USER_COUNT=$(psql $DATABASE_URL -t -c "SELECT COUNT(*) FROM users;")
echo "Users in database: $USER_COUNT"
```

## 5. Authentication & User Setup

### OAuth + Admin Setup Process
1. **Deploy the application**
2. **Visit `/admin-setup` endpoint**
3. **Login with OAuth (Replit/Google)**
4. **System automatically creates admin user**

### Manual Admin Creation (Alternative)
```sql
-- If OAuth is not available, manually create admin
INSERT INTO users (id, email, password, firstName, lastName, role, createdAt, updatedAt)
VALUES 
('admin-001', 'admin@yourdomain.com', 'hashed_password_here', 'Admin', 'User', 'admin', NOW(), NOW());
```

## 6. Production Checklist

### Pre-Deployment
- [ ] Configure actual database hostname/IP in .env.production
- [ ] Set up SSL certificates
- [ ] Configure domain DNS
- [ ] Set up Paystack production keys
- [ ] Test database connection

### Post-Deployment
- [ ] Verify health endpoint: `curl https://yourdomain.com/api/health`
- [ ] Create admin user via `/admin-setup`
- [ ] Test user registration and login
- [ ] Verify payment integration
- [ ] Check file uploads work

## 7. Troubleshooting Common Issues

### Database Connection Issues
```bash
# Test database connection
psql $DATABASE_URL -c "SELECT version();"

# Check if tables exist
psql $DATABASE_URL -c "\dt"

# View database logs
docker-compose logs db
```

### SSL/Domain Issues
```bash
# Test SSL certificate
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com

# Check DNS resolution
nslookup yourdomain.com
```

### Application Issues
```bash
# View application logs
docker-compose logs app

# Check running services
docker-compose ps

# Restart services
docker-compose restart
```

## 8. Monitoring & Maintenance

### Health Monitoring
```bash
# Setup cron job for health checks
*/5 * * * * curl -f https://yourdomain.com/api/health || echo "LMS down" | mail admin@yourdomain.com
```

### Backup Strategy
```bash
# Daily database backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Weekly file backup
tar -czf files_backup_$(date +%Y%m%d).tar.gz uploads/ certificates/
```

## 9. Next Steps

1. **Update .env.production** with your actual values
2. **Run the deployment script**: `./production-deploy.sh`
3. **Visit your domain** to verify deployment
4. **Complete admin setup** at `/admin-setup`
5. **Test core functionality** (login, courses, payments)

This guide addresses all the challenges you mentioned and provides a streamlined path to production deployment.