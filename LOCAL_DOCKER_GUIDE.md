# Local Docker Setup Guide
## Extract Demo Data to Docker Container

This guide helps you set up the LMS in Docker on your local PC while preserving all your demo data.

## What This Does

✅ **Extracts your current demo data** (users, courses, messages, files)  
✅ **Creates local Docker containers** (PostgreSQL + LMS app)  
✅ **Imports all demo data** into the Docker database  
✅ **Copies all file assets** (uploads, certificates, thumbnails)  
✅ **Sets up local environment** for testing and development  

## Quick Setup (Choose Your Platform)

### For Windows (PowerShell)
```powershell
.\local-docker-setup.ps1
```

### For Mac/Linux (Bash)
```bash
./local-docker-setup.sh
```

## What Gets Extracted

### Database Data
- **All users** (including your demo-israel-123 mentor account)
- **Courses and content** (with enrollment data) 
- **Messages and conversations** (mentor-student communications)
- **Notifications and activities**
- **Session data** (authentication preserved)

### File Assets  
- **Course uploads** (`uploads/` folder)
- **Generated certificates** (`certificates/` folder)
- **Course thumbnails** (`public/course-thumbnails/`)

## After Setup

Your LMS will be running at: **http://localhost:5000**

### Available Accounts
All your existing demo accounts will work:
- **Admin**: Access admin dashboard
- **Mentors**: Israel Alabi and other mentor accounts  
- **Students**: All enrolled students with course progress

### Management Commands
```bash
# View application logs
docker-compose -f docker-compose.local.yml logs -f app

# Access database directly
docker exec -it codelab_db_local psql -U postgres -d codelab_educare_lms

# Restart services
docker-compose -f docker-compose.local.yml restart

# Stop everything
docker-compose -f docker-compose.local.yml down
```

## File Structure After Setup

```
your-project/
├── demo-data/                    # ← All extracted data
│   ├── current_database.sql      # ← Complete database export
│   ├── uploads/                  # ← Course files and uploads
│   ├── certificates/             # ← Generated certificates
│   └── course-thumbnails/        # ← Course image assets
├── docker-compose.local.yml      # ← Local Docker configuration
├── .env.local                    # ← Local environment settings
└── local-docker-setup.* scripts  # ← Setup automation
```

## Environment Configuration

The script creates `.env.local` with:
- **PostgreSQL database** running in Docker container
- **Local development settings** (no external dependencies)
- **Test payment keys** (safe for local testing)
- **Session storage** configured for Docker network

## Requirements

- **Docker Desktop** installed and running
- **PostgreSQL tools** (psql) for data extraction
- **Current LMS instance** with demo data (optional - uses backup.sql if available)

## Troubleshooting

### If Docker Containers Don't Start
```bash
# Check Docker is running
docker version

# View container logs
docker-compose -f docker-compose.local.yml logs
```

### If Demo Data Doesn't Import
- Script falls back to `backup.sql` if current database unavailable
- Check `demo-data/current_database.sql` was created
- Manually import: `docker exec codelab_db_local psql -U postgres -d codelab_educare_lms -f /docker-entrypoint-initdb.d/current_database.sql`

### If File Assets Missing
- Files copied to `demo-data/uploads`, `demo-data/certificates`
- Docker volumes mount these directories into containers
- Restart containers if files appear missing: `docker-compose -f docker-compose.local.yml restart`

This setup gives you a complete local Docker version of your LMS with all demo data preserved.