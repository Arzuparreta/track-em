# Complete Setup Guide

This guide provides detailed, step-by-step instructions for setting up and configuring the Music Manager CRM.

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Installation](#installation)
3. [Database Setup](#database-setup)
4. [Environment Configuration](#environment-configuration)
5. [Running Tests](#running-tests)
6. [Development Workflow](#development-workflow)
7. [Production Deployment](#production-deployment)
8. [Troubleshooting](#troubleshooting)
9. [API Documentation](#api-documentation)

---

## System Requirements

### Minimum Requirements

- **Operating System**: Linux, macOS, or Windows 10+
- **Node.js**: v18.0 or higher
- **npm**: v9.0 or higher (comes with Node.js)
- **RAM**: 2GB minimum (4GB recommended)
- **Disk Space**: 500MB for application + 1GB for database

### Recommended Requirements

- **CPU**: 2+ cores
- **RAM**: 4GB+
- **Disk**: SSD (faster database operations)
- **Network**: Stable internet (for package installation)

---

## Installation

### Step 1: Install Node.js

**macOS (using Homebrew):**
```bash
brew install node
```

**Ubuntu/Debian:**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Windows:**
- Download from https://nodejs.org/
- Run installer with default options

**Verify Installation:**
```bash
node --version  # Should show v18.x or higher
npm --version   # Should show v9.x or higher
```

### Step 2: Clone or Access Repository

If you have the repository locally:
```bash
cd /path/to/music-manager-crm
```

### Step 3: Install Dependencies

```bash
npm install
```

**Expected Output:**
```
added 663 packages, and audited 664 packages in 22s

180 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities
```

**Note:** Installation may take 1-2 minutes.

---

## Database Setup

### Option A: Docker (Recommended for Development)

#### 1. Install Docker

**macOS:** Download Docker Desktop from https://www.docker.com/products/docker-desktop/

**Ubuntu:**
```bash
sudo apt-get update
sudo apt-get install docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker
```

**Windows:** Download Docker Desktop from https://www.docker.com/products/docker-desktop/

#### 2. Start Database

```bash
docker-compose up -d
```

**Expected Output:**
```
Creating network "no-te-escapas_default" with the default driver
Creating volume "no-te-escapas_pgdata" with default driver
Creating crm-db ... done
```

#### 3. Verify Database is Running

```bash
docker-compose ps
```

**Expected Output:**
```
NAME                COMMAND                  SERVICE    STATUS
crm-db              "docker-entrypoint.s…"   db         running (healthy)
```

#### 4. Stop Database (When Done)

```bash
docker-compose down
```

### Option B: Manual PostgreSQL Installation

#### Ubuntu/Debian:

```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### macOS (using Homebrew):

```bash
brew install postgresql
brew services start postgresql
```

#### Create Database:

```bash
# Switch to postgres user
sudo -u postgres psql

# In psql prompt:
CREATE DATABASE music_manager_crm;
CREATE USER postgres WITH PASSWORD 'your-password';
GRANT ALL PRIVILEGES ON DATABASE music_manager_crm TO postgres;
\q
```

#### Update `.env`:

```
DATABASE_URL=postgresql://postgres:your-password@localhost:5432/music_manager_crm
```

---

## Environment Configuration

### Step 1: Copy Example File

```bash
cp .env.example .env
```

### Step 2: Generate Password Hash

You need a bcrypt hash of your password.

**Using Node.js (No Install Needed):**
```bash
node -e "import('bcrypt').then(bcrypt => bcrypt.hash('your-password', 10).then(hash => console.log(hash)))"
```

**Using the Provided Script:**
```bash
node scripts/generate-hash.js
```

**Using npx:**
```bash
npx bcrypt
# Enter your password (input is hidden)
# Copy the output hash
```

**Example Output:**
```
$2b$10$abcdefghijklmnopqrstuvwxyz0123456789ABCDEF
```

### Step 3: Edit `.env` File

Use a text editor or `sed` to update values:

```bash
nano .env
```

**Required Changes:**

```bash
# Line 7: NEXTAUTH_SECRET
NEXTAUTH_SECRET=your-super-secret-key-32-characters-minimum

# Line 10-11: Credentials
APP_USER_EMAIL=admin@yourdomain.com
APP_USER_PASSWORD_HASH=$2b$10$abcdefghijklmnopqrstuvwxyz0123456789ABCDEF
```

**Optional: Google OAuth (for Gmail)**

1. Go to https://console.cloud.google.com/
2. Create a new project
3. Enable Gmail API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Secret to `.env`

**Optional: iCloud (for Contact Sync)**

1. Generate app-specific password: https://appleid.apple.com/
2. Add to `.env`:
   ```
   ICLOUD_USERNAME=your@icloud.com
   ICLOUD_APP_PASSWORD=generated-app-password
   ```

### Step 4: Verify Configuration

```bash
# Check critical values
cat .env | grep -E "(NEXTAUTH|APP_USER|DATABASE_URL)"
```

**Expected:**
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/music_manager_crm
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here
APP_USER_EMAIL=admin@yourdomain.com
APP_USER_PASSWORD_HASH=$2b$10$...
```

---

## Initialize Database

### Step 1: Generate Prisma Client

```bash
npx prisma generate
```

**Expected Output:**
```
Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma

✔ Generated Prisma Client (v5.16.0) to ./node_modules/@prisma/client
```

### Step 2: Run Migrations

```bash
npx prisma migrate dev --name init
```

**Expected Output:**
```
Applying migration `20240101000000_init`

The following migration(s) have been created and applied:

prisma/migrations/
   └─ 20240101000000_init/
       └─ migration.sql

Your database is now in sync with your schema.
```

### Step 3: Verify Database Connection

```bash
npx prisma studio
```

- Opens browser at http://localhost:5555
- Should show tables: Contact, Call, FollowUp, MailThread
- Close browser when done (Ctrl+C in terminal)

---

## Running Tests

### Run All Tests

```bash
npm run test
```

**Expected Output:**
```
 RUN  v2.1.9

✓ src/lib/auth.test.ts (5 tests)
✓ src/lib/utils/formatters.test.ts (10 tests)
✓ src/app/page.test.tsx (3 tests)

Test Files  3 passed (3)
      Tests  18 passed (18)
   Start at  16:28:36
   Duration  877ms
```

### Run Specific Test File

```bash
npm run test -- src/lib/auth.test.ts
```

### Watch Mode (Auto-run on changes)

```bash
npm run test:watch
```

### Run E2E Tests

```bash
# Install Playwright browsers first
npx playwright install

# Run tests
npm run test:e2e
```

### Test Coverage

```bash
npm run test -- --coverage
```

Generates `coverage/` directory with HTML report.

---

## Development Workflow

### Start Development Server

```bash
npm run dev
```

**Access Application:**
- Open http://localhost:3000
- Should redirect to login page

### Make Changes

1. Edit files in `src/`
2. Save changes
3. Browser auto-refreshes

### Run Tests After Changes

```bash
npm run test
```

### Check for Errors

```bash
npm run lint
```

### Build for Production

```bash
npm run build
```

**If build fails:**
- Check TypeScript errors
- Fix linting issues
- Ensure all imports are correct

---

## Production Deployment

### Docker Deployment

#### 1. Prepare Production Environment

```bash
# Copy env file
cp .env.example .env.production

# Edit for production values
nano .env.production
```

**Important:**
- Use production database URL
- Strong NEXTAUTH_SECRET (32+ chars)
- Valid credentials

#### 2. Build Docker Image

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

#### 3. Verify

```bash
docker-compose ps
docker-compose logs
```

### Manual Deployment

#### 1. Install Dependencies

```bash
npm install --production
```

#### 2. Build Application

```bash
npm run build
```

#### 3. Start Server

```bash
npm start
```

#### 4. Use Process Manager (Recommended)

**PM2:**
```bash
npm install -g pm2
pm2 start npm --name "crm" -- start
pm2 save
pm2 startup
```

**Systemd:**
```bash
# Create service file
sudo nano /etc/systemd/system/crm.service
```

```ini
[Unit]
Description=Music Manager CRM
After=network.target

[Service]
Type=simple
User=app
WorkingDirectory=/opt/crm
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm start
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable crm
sudo systemctl start crm
```

### Reverse Proxy Setup

#### Nginx

```nginx
server {
    listen 80;
    server_name crm.example.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### Caddy (Automatic HTTPS)

```
crm.example.com {
    reverse_proxy localhost:3000
}
```

---

## Troubleshooting

### Database Connection Issues

**Error:** `connect ECONNREFUSED 127.0.0.1:5432`

**Solutions:**

1. Check if PostgreSQL is running:
   ```bash
   docker-compose ps
   ```

2. Start if not running:
   ```bash
   docker-compose up -d
   ```

3. Check connection string:
   ```bash
   cat .env | grep DATABASE_URL
   ```

4. Test manually:
   ```bash
   psql -h localhost -U postgres -d music_manager_crm
   ```

### Prisma Client Errors

**Error:** `Cannot find module '@prisma/client'`

**Solution:**
```bash
rm -rf node_modules/.prisma
npx prisma generate
npm install
```

### Authentication Failures

**Error:** `Invalid email or password`

**Solutions:**

1. Check `.env` credentials:
   ```bash
   cat .env | grep APP_USER
   ```

2. Regenerate password hash:
   ```bash
   node scripts/generate-hash.js
   ```

3. Update `.env` with new hash

4. Restart server

### Port Already in Use

**Error:** `listen EADDRINUSE: address already in use 0.0.0.0:3000`

**Solutions:**

1. Find process:
   ```bash
   lsof -ti:3000
   ```

2. Kill it:
   ```bash
   kill -9 <PID>
   ```

3. Or use different port:
   ```bash
   npm run dev -- -p 3001
   ```

### Tests Failing

**Solution:**

1. Clear cache:
   ```bash
   rm -rf node_modules/.vitest .next
   ```

2. Reinstall:
   ```bash
   npm install
   ```

3. Run again:
   ```bash
   npm run test
   ```

### Build Failures

**Error:** `TypeScript compilation error`

**Solutions:**

1. Check TypeScript errors:
   ```bash
   npx tsc --noEmit
   ```

2. Fix type errors

3. Run lint:
   ```bash
   npm run lint
   ```

4. Try build again:
   ```bash
   npm run build
   ```

---

## API Documentation

### Authentication

#### POST /api/auth/signin

**Body:**
```json
{
  "email": "admin@example.com",
  "password": "your-password"
}
```

**Response:** Redirects to `/` on success

### Contacts

#### GET /api/contacts

**Query Parameters:**
- `search` (string): Search term

**Response:**
```json
{
  "data": [
    {
      "id": "cuid",
      "name": "John Doe",
      "emails": ["john@example.com"],
      "phones": ["555-1234"],
      "calls": [...],
      "_count": {
        "calls": 5,
        "followUps": 2
      }
    }
  ]
}
```

#### POST /api/contacts

**Body:**
```json
{
  "name": "Jane Smith",
  "emails": ["jane@example.com"],
  "phones": ["555-5678"],
  "notes": "Met at conference"
}
```

### Calls

#### POST /api/calls

**Body:**
```json
{
  "contactId": "cuid",
  "direction": "OUTBOUND",
  "startedAt": "2024-01-15T10:30:00Z",
  "durationSeconds": 1800,
  "reason": "Contract negotiation",
  "conclusion": "Agreed to terms",
  "createFollowUp": true,
  "followUpDate": "2024-01-22T10:00:00Z"
}
```

### Follow-ups

#### PUT /api/follow-ups/:id

**Body:**
```json
{
  "completed": true
}
```

---

## Performance Optimization

### Database Indexes

All important fields are indexed:
- `Contact.externalId`
- `Contact.source`
- `Call.contactId`
- `FollowUp.scheduledAt`
- `FollowUp.completed`

### Caching

- Next.js automatically caches static assets
- Consider Redis for session storage (future)

### Image Optimization

- Use Next.js Image component
- Automatic lazy loading
- Modern formats (WebP)

---

## Monitoring

### Logs

**Development:**
```bash
npm run dev
# Logs in terminal
```

**Production (PM2):**
```bash
pm2 logs crm
```

**Production (Docker):**
```bash
docker-compose logs -f
```

### Health Checks

```bash
# Check if app is running
curl http://localhost:3000/api/health

# Check database
npx prisma db execute --file /dev/stdin <<<'SELECT 1'
```

### Error Tracking

Consider adding:
- Sentry for error tracking
- Logrocket for session replay
- Datadog for performance monitoring

---

## Backup Strategy

### PostgreSQL Backups

**Daily Backup:**
```bash
#!/bin/bash
DATE=$(date +%Y%m%d)
pg_dump -U postgres music_manager_crm > backups/crm-$DATE.sql
```

**Restore:**
```bash
psql -U postgres -d music_manager_crm < backups/crm-20240101.sql
```

### Automated Backups

**Cron Job:**
```bash
# Daily at 2 AM
0 2 * * * /opt/crm/scripts/backup.sh
```

---

## Security Best Practices

### Required

- ✅ Use HTTPS in production
- ✅ Strong passwords (12+ characters)
- ✅ Regular updates
- ✅ Database backups
- ✅ Environment variables for secrets
- ✅ Rate limiting

### Recommended

- 🔲 Two-factor authentication
- 🔲 Audit logging
- 🔲 IP whitelisting
- 🔲 Session expiration
- 🔲 Security headers
- 🔲 Regular security audits

### Optional

- 🔲 Database encryption at rest
- 🔲 VPN access only
- 🔲 Multi-region deployment
- 🔲 Disaster recovery plan

---

## Scaling

### Vertical Scaling

- Increase server RAM/CPU
- Use more powerful database server

### Horizontal Scaling

- Load balancer (Nginx, HAProxy)
- Multiple app instances
- Database replication

### Caching Layer

- Redis for sessions
- CDN for static assets
- Database query caching

---

## Migration from Development to Production

### Checklist

- [ ] Update `.env` for production
- [ ] Build application (`npm run build`)
- [ ] Test build locally
- [ ] Set up production database
- [ ] Run migrations
- [ ] Configure SSL/TLS
- [ ] Set up monitoring
- [ ] Configure backups
- [ ] Test deployment
- [ ] Document IPs/domains
- [ ] Set up alerts
- [ ] Go live! 🎉

---

## Support Resources

### Official Documentation

- Setup Guide: This file
- Quick Start: `QUICKSTART.md`
- Full Plan: `docs/BUILDPLAN.md`
- Implementation: `IMPLEMENTATION_SUMMARY.md`

### Community

- GitHub Issues: Bug reports
- Discussions: Q&A
- Discord: Community chat (future)

### Professional Support

For custom deployments or consulting:
- Contact via GitHub
- Professional services available

---

## Final Checklist

Before Going Live:

- [ ] All tests passing
- [ ] Production build successful
- [ ] Database backed up
- [ ] HTTPS enabled
- [ ] Monitoring configured
- [ ] Backups scheduled
- [ ] Team trained
- [ ] Documentation complete
- [ ] Rollback plan ready
- [ ] Emergency contacts listed

---

## Conclusion

You now have a fully functional Music Manager CRM!

**Quick Recap:**
1. ✅ Installed dependencies
2. ✅ Configured database
3. ✅ Set up environment
4. ✅ Ran tests (all passing)
5. ✅ Ready for production

**Next Steps:**
- Add your contacts
- Log your first call
- Schedule follow-ups
- Explore features

**Need Help?**
- Check troubleshooting section
- Review documentation
- Open GitHub issue

Happy Managing! 🎵✨

---

*Last Updated: April 2026*
*Version: 0.1.0*