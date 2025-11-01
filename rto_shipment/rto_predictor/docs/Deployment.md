# Deployment Guide

Complete guide for deploying the RTO Prediction System across different environments.

---

## Table of Contents

- [Overview](#overview)
- [Development Environment](#development-environment)
- [Staging Environment](#staging-environment)
- [Production Environment](#production-environment)
- [Docker Deployment](#docker-deployment)
- [Configuration Management](#configuration-management)
- [Monitoring & Maintenance](#monitoring--maintenance)
- [Security](#security)
- [Troubleshooting](#troubleshooting)

---

## Overview

### Deployment Options

| Method | Best For | Complexity | Scalability |
|--------|----------|------------|-------------|
| **Docker Compose** | Development, Small deployments | Low | Medium |
| **Docker Swarm** | Medium deployments | Medium | High |
| **Kubernetes** | Large scale, Cloud | High | Very High |
| **Traditional** | Legacy systems | Medium | Medium |

### System Requirements

**Minimum:**
- CPU: 2 cores
- RAM: 4GB
- Disk: 20GB
- OS: Linux, macOS, Windows (WSL2)

**Recommended (Production):**
- CPU: 4+ cores
- RAM: 8GB+
- Disk: 50GB+ (SSD)
- OS: Ubuntu 20.04+, CentOS 8+

---

## Development Environment

For local development and testing.

### Using Docker (Recommended)

**Quick Start:**

```bash
# Navigate to project
cd rto_predictor

# Create environment file
cp .env.example .env

# Start development environment
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Check status
docker compose ps

# View logs
docker compose logs -f backend
```

**Using Makefile:**

```bash
# Setup
make setup-env
make dev

# View logs
make dev-logs

# Stop
make dev-down
```

### Configuration

**Development .env:**

```env
# Database
POSTGRES_DB=rto_predictions
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_PORT=5432

# API
API_HOST=0.0.0.0
API_PORT=8002
LOG_LEVEL=DEBUG

# Development Features
ENABLE_SWAGGER=true
ENABLE_CORS=true
RELOAD=true

# Database URL
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/rto_predictions
```

### Access Points

- **API:** http://localhost:8002
- **API Docs:** http://localhost:8002/docs
- **Database:** localhost:5432
- **Debugger:** localhost:5678

### Development Features

✅ **Hot Reload** - Code changes auto-reload
✅ **Debug Logging** - Detailed logs (DEBUG level)
✅ **Swagger UI** - Interactive API documentation
✅ **Source Mounting** - Live code updates
✅ **Debug Port** - Python debugger support

### Daily Workflow

```bash
# Start services
make dev

# Make code changes in src/
# Backend reloads automatically

# Run migrations if needed
docker compose exec backend python scripts/run_migrations.py upgrade

# View logs
make dev-logs

# Stop services
make dev-down
```

---

## Staging Environment

For testing production-like configuration before final deployment.

### Setup

**1. Server Preparation:**

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify
docker --version
docker compose version
```

**2. Deploy Application:**

```bash
# Clone repository
git clone <repository-url>
cd rto_predictor

# Create staging environment file
cp .env.example .env.staging

# Edit with staging configuration
nano .env.staging
```

**Staging .env:**

```env
# Database - Use separate database
POSTGRES_DB=rto_predictions_staging
POSTGRES_USER=rto_staging
POSTGRES_PASSWORD=<STRONG_PASSWORD>
POSTGRES_PORT=5432

# API
API_HOST=0.0.0.0
API_PORT=8002
LOG_LEVEL=INFO

# Features
ENABLE_SWAGGER=true
ENABLE_CORS=true

# Workers
WORKERS=2

# Database URL
DATABASE_URL=postgresql://rto_staging:<PASSWORD>@postgres:5432/rto_predictions_staging
```

**3. Start Services:**

```bash
# Build images
docker compose build

# Start services
docker compose up -d

# Check logs
docker compose logs -f backend

# Verify health
curl http://localhost:8002/health
```

### Staging Checklist

- [ ] Separate database from production
- [ ] Test migrations on staging data
- [ ] Verify all API endpoints
- [ ] Test backup/restore procedures
- [ ] Load test with realistic data
- [ ] Monitor performance metrics
- [ ] Test failure scenarios
- [ ] Verify logging and monitoring

---

## Production Environment

Full production deployment with high availability and security.

### Pre-Deployment Checklist

**Infrastructure:**
- [ ] Production server provisioned
- [ ] SSL certificates obtained
- [ ] Domain/DNS configured
- [ ] Firewall rules set up
- [ ] Backup storage configured
- [ ] Monitoring tools ready

**Application:**
- [ ] Code tested on staging
- [ ] Database migrations tested
- [ ] Environment variables configured
- [ ] Secrets management set up
- [ ] Log rotation configured
- [ ] Health checks verified

**Security:**
- [ ] Strong passwords set
- [ ] API authentication enabled
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] Swagger disabled in production
- [ ] Security headers enabled

### Production Deployment

#### Option 1: Docker Compose (Simple Production)

**1. Server Setup:**

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker + Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Create application user
sudo useradd -m -s /bin/bash rto-app
sudo usermod -aG docker rto-app
```

**2. Application Deployment:**

```bash
# Switch to app user
sudo su - rto-app

# Clone repository
git clone <repository-url>
cd rto_predictor

# Create production .env
cp .env.example .env
```

**Production .env:**

```env
# Database - PRODUCTION CREDENTIALS
POSTGRES_DB=rto_predictions
POSTGRES_USER=rto_prod
POSTGRES_PASSWORD=<VERY_STRONG_PASSWORD>
POSTGRES_PORT=5432

# API
API_HOST=0.0.0.0
API_PORT=8002
LOG_LEVEL=WARNING

# Security
ENABLE_SWAGGER=false
ENABLE_CORS=false
API_SECRET_KEY=<RANDOM_SECRET_KEY_HERE>

# Performance
WORKERS=4
POOL_SIZE=20
POOL_OVERFLOW=10

# Database URL
DATABASE_URL=postgresql://rto_prod:<PASSWORD>@postgres:5432/rto_predictions
```

**3. Start Production:**

```bash
# Build production images
docker compose -f docker-compose.yml -f docker-compose.prod.yml build

# Start services
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Check status
docker compose ps

# View logs
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f backend
```

**Or using Makefile:**

```bash
make setup-env
# Edit .env with production settings
make prod-deploy
```

#### Option 2: With Nginx Reverse Proxy

**1. Install Nginx:**

```bash
sudo apt install nginx -y
```

**2. Configure Nginx:**

Create `/etc/nginx/sites-available/rto-prediction`:

```nginx
upstream rto_backend {
    server localhost:8002;
}

server {
    listen 80;
    server_name your-domain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL Configuration
    ssl_certificate /etc/ssl/certs/your-domain.crt;
    ssl_certificate_key /etc/ssl/private/your-domain.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000" always;

    # Logging
    access_log /var/log/nginx/rto_access.log;
    error_log /var/log/nginx/rto_error.log;

    # API Proxy
    location /api/ {
        proxy_pass http://rto_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check (no auth)
    location /health {
        proxy_pass http://rto_backend/health;
    }

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req zone=api_limit burst=20 nodelay;
}
```

**3. Enable and Test:**

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/rto-prediction /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

#### Option 3: Docker Swarm (High Availability)

**1. Initialize Swarm:**

```bash
# On manager node
docker swarm init --advertise-addr <MANAGER_IP>

# On worker nodes (use token from above)
docker swarm join --token <TOKEN> <MANAGER_IP>:2377
```

**2. Create Secrets:**

```bash
# Create database password secret
echo "strong_password" | docker secret create postgres_password -

# Create API secret
echo "api_secret_key" | docker secret create api_secret -
```

**3. Deploy Stack:**

Create `docker-stack.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    secrets:
      - postgres_password
    environment:
      POSTGRES_DB: rto_predictions
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD_FILE: /run/secrets/postgres_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - rto-network
    deploy:
      replicas: 1
      placement:
        constraints:
          - node.role == manager

  backend:
    image: rto-backend:latest
    secrets:
      - postgres_password
      - api_secret
    environment:
      DATABASE_URL: postgresql://postgres@postgres:5432/rto_predictions
      WORKERS: 4
    ports:
      - "8002:8002"
    networks:
      - rto-network
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
    depends_on:
      - postgres

volumes:
  postgres_data:

networks:
  rto-network:
    driver: overlay

secrets:
  postgres_password:
    external: true
  api_secret:
    external: true
```

**4. Deploy:**

```bash
# Deploy stack
docker stack deploy -c docker-stack.yml rto-stack

# Check services
docker service ls

# View logs
docker service logs -f rto-stack_backend

# Scale backend
docker service scale rto-stack_backend=5
```

---

## Docker Deployment

### Container Architecture

```
┌─────────────────────────────────────┐
│         Nginx (Optional)            │
│         Port 80/443                 │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Backend API Container          │
│      • FastAPI + Uvicorn            │
│      • Port 8002                    │
│      • 4 Workers (Production)       │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│    PostgreSQL Container             │
│    • PostgreSQL 15                  │
│    • Port 5432                      │
│    • Persistent Volume              │
└─────────────────────────────────────┘
```

### Building Images

**Development:**

```bash
# Build backend
docker compose build backend

# Build with no cache
docker compose build --no-cache backend
```

**Production:**

```bash
# Build production image
docker compose -f docker-compose.yml -f docker-compose.prod.yml build

# Tag for registry
docker tag rto-backend:latest your-registry/rto-backend:v1.0.0

# Push to registry
docker push your-registry/rto-backend:v1.0.0
```

### Container Management

```bash
# Start services
docker compose up -d

# Stop services
docker compose down

# Restart specific service
docker compose restart backend

# View logs
docker compose logs -f backend

# Execute command in container
docker compose exec backend bash

# Check resource usage
docker stats
```

### Volume Management

```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect rto_predictor_postgres_data

# Backup volume
docker run --rm -v rto_predictor_postgres_data:/data -v $(pwd):/backup \
    alpine tar czf /backup/postgres_backup.tar.gz -C /data .

# Restore volume
docker run --rm -v rto_predictor_postgres_data:/data -v $(pwd):/backup \
    alpine tar xzf /backup/postgres_backup.tar.gz -C /data
```

---

## Configuration Management

### Environment Variables

**Required Variables:**

| Variable | Development | Staging | Production |
|----------|-------------|---------|------------|
| `POSTGRES_DB` | rto_predictions | rto_predictions_staging | rto_predictions |
| `POSTGRES_PASSWORD` | postgres | Strong password | Very strong password |
| `API_PORT` | 8002 | 8002 | 8002 |
| `LOG_LEVEL` | DEBUG | INFO | WARNING |
| `ENABLE_SWAGGER` | true | true | false |
| `WORKERS` | 1 | 2 | 4+ |

### Secrets Management

**Option 1: Environment Files (Development)**

```bash
# .env file (not committed)
POSTGRES_PASSWORD=secret
API_SECRET_KEY=secret_key
```

**Option 2: Docker Secrets (Production)**

```bash
# Create secrets
echo "prod_password" | docker secret create db_password -
echo "api_key" | docker secret create api_key -

# Use in compose file
secrets:
  - db_password
  - api_key
```

**Option 3: External Secret Manager**

```bash
# AWS Secrets Manager
aws secretsmanager get-secret-value --secret-id rto/db/password

# HashiCorp Vault
vault kv get secret/rto/database
```

---

## Monitoring & Maintenance

### Health Checks

**API Health Endpoint:**

```bash
curl http://localhost:8002/health
```

**Response:**

```json
{
  "status": "healthy",
  "model_loaded": true,
  "database": "connected",
  "uptime_seconds": 3600,
  "timestamp": "2025-01-01T10:00:00"
}
```

**System Metrics:**

```bash
curl http://localhost:8002/api/v1/metrics
```

### Logging

**View Logs:**

```bash
# All services
docker compose logs -f

# Backend only
docker compose logs -f backend

# Last 100 lines
docker compose logs --tail=100 backend

# Follow logs
docker compose logs -f --tail=50 backend
```

**Log Rotation:**

Create `/etc/docker/daemon.json`:

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

### Automated Backups

**Database Backup Script:**

Create `backup.sh`:

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/rto"
mkdir -p $BACKUP_DIR

# Database backup
docker compose exec -T postgres pg_dump -U postgres rto_predictions \
    > $BACKUP_DIR/db_backup_$DATE.sql

# Compress
gzip $BACKUP_DIR/db_backup_$DATE.sql

# Keep last 30 days
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +30 -delete

echo "Backup completed: db_backup_$DATE.sql.gz"
```

**Cron Job:**

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /path/to/backup.sh >> /var/log/rto_backup.log 2>&1
```

### Updates & Upgrades

**Application Updates:**

```bash
# Pull latest code
git pull origin main

# Rebuild images
docker compose build backend

# Restart with new image
docker compose up -d backend

# Run migrations if needed
docker compose exec backend python scripts/run_migrations.py upgrade
```

**Zero-Downtime Updates:**

```bash
# Build new image
docker compose build backend

# Scale up with new version
docker compose up -d --scale backend=2 --no-recreate backend

# Wait for health check
sleep 10

# Remove old containers
docker compose up -d --scale backend=1 backend
```

---

## Security

### Production Security Checklist

**Application:**
- [ ] Disable Swagger UI (`ENABLE_SWAGGER=false`)
- [ ] Configure CORS properly (not `*`)
- [ ] Use strong database passwords
- [ ] Implement rate limiting
- [ ] Enable HTTPS/SSL
- [ ] Set security headers

**Infrastructure:**
- [ ] Configure firewall (UFW/iptables)
- [ ] Use private networks for services
- [ ] Regular security updates
- [ ] Monitor failed login attempts
- [ ] Implement intrusion detection

**Data:**
- [ ] Encrypt data at rest
- [ ] Encrypt data in transit (SSL)
- [ ] Regular backups
- [ ] Secure backup storage
- [ ] Access control for sensitive data

### Firewall Configuration

```bash
# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow API (if not behind Nginx)
sudo ufw allow 8002/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

### SSL/TLS Configuration

**Using Let's Encrypt:**

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo certbot renew --dry-run
```

---

## Troubleshooting

### Common Issues

#### Containers Won't Start

```bash
# Check logs
docker compose logs backend

# Check container status
docker compose ps

# Rebuild
docker compose build --no-cache backend
docker compose up -d
```

#### Database Connection Failed

```bash
# Check PostgreSQL is running
docker compose ps postgres

# Check logs
docker compose logs postgres

# Verify DATABASE_URL
docker compose exec backend env | grep DATABASE

# Test connection
docker compose exec postgres pg_isready
```

#### Port Already in Use

```bash
# Find process using port
lsof -i :8002

# Kill process
kill -9 <PID>

# Or change port in .env
API_PORT=8003
```

#### Out of Disk Space

```bash
# Check disk usage
df -h

# Clean Docker resources
docker system prune -a

# Remove old images
docker image prune -a

# Remove unused volumes
docker volume prune
```

---

## Deployment Comparison

| Feature | Development | Staging | Production |
|---------|------------|---------|------------|
| **Docker Compose** | ✅ Recommended | ✅ Suitable | ⚠️ Small scale only |
| **Hot Reload** | ✅ Enabled | ❌ Disabled | ❌ Disabled |
| **Swagger UI** | ✅ Enabled | ✅ Enabled | ❌ Disabled |
| **Workers** | 1 | 2 | 4+ |
| **Log Level** | DEBUG | INFO | WARNING |
| **SSL** | ❌ Not needed | ⚠️ Optional | ✅ Required |
| **Backups** | ❌ Not needed | ✅ Daily | ✅ Automated |
| **Monitoring** | ❌ Not needed | ⚠️ Basic | ✅ Full |
| **Security** | ⚠️ Minimal | ✅ Enhanced | ✅ Maximum |

---

## Quick Reference

### Start Commands

```bash
# Development
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
# Or: make dev

# Production
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
# Or: make prod
```

### Stop Commands

```bash
# Stop services
docker compose down

# Stop and remove volumes
docker compose down -v
```

### Useful Commands

```bash
# View logs
docker compose logs -f backend

# Execute shell
docker compose exec backend bash

# Run migrations
docker compose exec backend python scripts/run_migrations.py upgrade

# Database shell
docker compose exec postgres psql -U postgres -d rto_predictions

# Check health
curl http://localhost:8002/health
```

---

## References

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

## Related Documentation

- [Quick Setup Guide](Quicksetup.md) - Fast setup
- [Local Setup Guide](LocalSetup.md) - Development setup
- [Database Documentation](Database.md) - Database management
- [Technical Documentation](Technical.md) - Architecture

---

**Version:** 2.0.0
**Last Updated:** January 2025

**Deployment Status:** ✅ Ready for all environments
