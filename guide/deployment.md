---
title: Cloudflare Management Guide
description: Operational guidance for deploying and managing the Argus platform on Cloudflare Workers.
---

# Cloudflare Management Guide

**Version**: 1.0  
**Last Updated**: 2025-10-31  
**Status**: ✅ Cloudflare-Native Production Environment

---

## 📋 Overview

All Argus Platform services are now deployed on Cloudflare's edge infrastructure. This guide covers deployment, monitoring, troubleshooting, and management of the Cloudflare-native architecture.

### Service URLs

| Service | Production URL | Purpose |
|---------|---------------|---------|
| Frontend (fe2) | https://argus.knogin.com | Next.js web application |
| Middleware | https://api.knogin.com | FastAPI + GraphQL API |
| Auth Service | https://auth.knogin.com | Authentication & SSO |

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         User Browser                        │
│                  https://argus.knogin.com                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ Next.js on Cloudflare Workers
                         │ (OpenNext adapter)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                      fe2 Worker                             │
│               Cloudflare Workers + Pages                    │
│                                                              │
│  - SSR/SSG rendering                                        │
│  - Static asset delivery                                    │
│  - /api/graphql proxy → middleware                          │
│  - Auth cookie handling                                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ├─────────────────┬──────────────────┐
                         ▼                 ▼                  ▼
┌─────────────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│   auth_service          │ │  argus_middleware│ │ Cloudflare KV    │
│  Workers Container      │ │ Workers Container│ │ - Schema cache   │
│  - Google/MS SSO        │ │ - FastAPI        │ │ - Feature flags  │
│  - JWT generation       │ │ - GraphQL        │ │ - Session data   │
│  - Cookie management    │ │ - Domain logic   │ └──────────────────┘
└─────────────────────────┘ └────────┬─────────┘
                                     │
                         ┌───────────┴──────────┐
                         ▼                      ▼
         ┌───────────────────────┐  ┌──────────────────┐
         │  PostgreSQL (DO)      │  │  Neo4j (Cloud)   │
         │  via Hyperdrive       │  │  Graph database  │
         └───────────────────────┘  └──────────────────┘
```

---

## 🚀 Deployment

### 🔑 Important: Deployment Methods Vary by Service

| Service | Method | Auto-Deploy on Git Push? |
|---------|--------|--------------------------|
| **fe2** | Auto via GitHub Actions | ✅ Yes (on push to main) |
| **argus_middleware** | Auto via GitHub Actions OR manual `./deploy.sh` | ✅ Yes (on push to main) |
| **auth_service** | Manual `./deploy.sh` | ❌ No |

**📖 See `DEPLOYMENT_COMPARISON.md` in the repo root for detailed comparison of Workers vs Containers deployment.**

### Key Differences

- **fe2 (Frontend)**: Uses Cloudflare Workers (JavaScript runtime), no Docker required
- **argus_middleware + auth_service (Containers)**: Use Cloudflare Workers Containers (Docker), require `docker-wrapper.sh` script to work around wrangler stdin bug

### Prerequisites

```bash
# Install Wrangler CLI globally
npm install -g wrangler@latest

# Authenticate with Cloudflare
wrangler login

# Verify authentication
wrangler whoami
```

### Deploying fe2 (Frontend) - **AUTO-DEPLOY VIA GITHUB ACTIONS**

> **✅ This service HAS auto-deploy**: Pushes to `main` branch automatically trigger deployment via GitHub Actions.

**Option 1: Auto-Deploy (Recommended)**
```bash
# Simply commit and push to main branch
git add .
git commit -m "fix: your changes"
git push origin main

# GitHub Actions will automatically:
# 1. Install dependencies and build workspace packages
# 2. Build for Cloudflare Workers using OpenNext
# 3. Deploy to production at https://argus.knogin.com
# 4. Verify health endpoint

# Monitor deployment: https://github.com/your-org/fe2/actions
```

**Option 2: Manual Deploy (For Testing/Emergency)**
```bash
# Navigate to fe2 directory
cd /mnt/development/fe2/fe2

# Install all dependencies
npm install

# Build workspace packages (@argus/ui, @argus/graphql, etc.)
npm run build:packages

# Install web app dependencies
cd apps/web && npm install && cd ../..

# Build for Cloudflare (creates .open-next/ directory)
cd apps/web
npm run build:cloudflare:production

# Deploy to production (manual override)
npm run deploy:production

# Or deploy to staging
npm run build:cloudflare:staging
npm run deploy:staging
```

**Verification:**
```bash
# Check deployment status
npx wrangler deployments list

# Test health endpoint
curl https://argus.knogin.com/api/health

# Watch live logs
npx wrangler tail fe2
```

### Deploying argus_middleware (Backend API) - **AUTO-DEPLOY + MANUAL OPTIONS**

> **✅ This service HAS auto-deploy**: Pushes to `main` branch automatically trigger deployment via GitHub Actions.

**Option 1: Auto-Deploy (Recommended)**
```bash
# Simply push to main branch
git add .
git commit -m "feat: your changes"
git push origin main

# GitHub Actions will automatically:
# 1. Build the Docker container
# 2. Deploy to Cloudflare Workers
# 3. Verify health endpoint

# Monitor deployment: https://github.com/your-org/argus_middleware/actions
```

**Option 2: Manual Deploy (Alternative)**
```bash
# Navigate to middleware workers directory
cd /mnt/development/argus_middleware/argus_middleware/cloudflare-workers

# Install dependencies (first time)
npm install

# Configure secrets (first time only - see Secrets Management section)
./bulk-set-secrets.sh

# Deploy manually using the wrapper script
./deploy.sh

# Or use wrangler directly (docker-wrapper.sh needed)
export WRANGLER_DOCKER_BIN="$(pwd)/docker-wrapper.sh"
npx wrangler deploy
```

**Verification:**
```bash
# Check container health
curl https://api.knogin.com/health
# Should return: {"worker":"ok","container":"ok"}

# Check GraphQL endpoint
curl https://api.knogin.com/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __schema { queryType { name } } }"}'

# Watch logs
npx wrangler tail
```

### Deploying auth_service - **MANUAL DEPLOYMENT REQUIRED**

> **Note**: auth_service does NOT auto-deploy on git push. Manual deployment required for security review.

```bash
# Navigate to auth service workers directory
cd /mnt/development/auth_service/cloudflare-workers

# Install dependencies (first time)
npm install

# Configure secrets (first time only)
# Set: SECRET_KEY, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET,
#      MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET, etc.

# Deploy using the wrapper script
./deploy.sh

# Or use wrangler directly (docker-wrapper.sh needed)
export WRANGLER_DOCKER_BIN="$(pwd)/docker-wrapper.sh"
npx wrangler deploy
```

**Why Manual?** Authentication is security-critical and requires careful review before deployment.

**Verification:**
```bash
# Check health
curl https://auth.knogin.com/health
# Should return: {"status":"healthy","service":"auth_service"}

# Check OAuth providers configured
curl https://auth.knogin.com/v1/portal/sso/providers
```

---

## 🔐 Secrets Management

### Required Secrets by Service

#### argus_middleware
```bash
cd /mnt/development/argus_middleware/argus_middleware/cloudflare-workers

# Core secrets
npx wrangler secret put SECRET_KEY
npx wrangler secret put INTERNAL_SERVICE_BYPASS_KEY

# Database credentials
npx wrangler secret put POSTGRES_USER
npx wrangler secret put POSTGRES_PASSWORD
npx wrangler secret put POSTGRES_HOST
npx wrangler secret put POSTGRES_DB
npx wrangler secret put NEO4J_URI
npx wrangler secret put NEO4J_USER
npx wrangler secret put NEO4J_PASSWORD

# AI API keys
npx wrangler secret put GEMINI_API_KEY
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put ANTHROPIC_API_KEY
npx wrangler secret put XAI_API_KEY

# Firebase
npx wrangler secret put FIREBASE_KEY_JSON
```

#### auth_service
```bash
cd /mnt/development/auth_service/cloudflare-workers

# Core secrets
npx wrangler secret put SECRET_KEY  # MUST match middleware SECRET_KEY
npx wrangler secret put FIRST_SUPERUSER_PASSWORD

# SSO providers
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put MICROSOFT_CLIENT_ID
npx wrangler secret put MICROSOFT_CLIENT_SECRET

# Other
npx wrangler secret put GEMINI_API_KEY
npx wrangler secret put FIREBASE_KEY_JSON
npx wrangler secret put INTERNAL_SERVICE_BYPASS_KEY
```

**⚠️ CRITICAL**: The `SECRET_KEY` must be identical in both `auth_service` and `argus_middleware` for JWT validation to work.

### Managing Secrets

```bash
# List all secrets for a worker
npx wrangler secret list

# Delete a secret
npx wrangler secret delete SECRET_NAME

# Bulk set secrets using script
./bulk-set-secrets.sh
```

---

## 🗄️ Database Configuration

### PostgreSQL via Hyperdrive

Cloudflare Hyperdrive provides connection pooling and query caching for PostgreSQL.

**Configuration:**
- **Hyperdrive ID**: `a45ec90abb6c4d899e8d5640d946a4aa`
- **Database**: Digital Ocean PostgreSQL 17.6
- **Host**: argus-master-do-user-4031547-0.g.db.ondigitalocean.com
- **Port**: 25060
- **Database**: argus_db
- **Connection Limit**: 24 (out of 25 max)

**Access in Workers:**
```typescript
interface Env {
  HYPERDRIVE: Hyperdrive;
}

const client = new Client({
  connectionString: env.HYPERDRIVE.connectionString,
});
```

**Hyperdrive Commands:**
```bash
# List Hyperdrive configs
npx wrangler hyperdrive list

# Get config details
npx wrangler hyperdrive get a45ec90abb6c4d899e8d5640d946a4aa

# Update connection string
npx wrangler hyperdrive update a45ec90abb6c4d899e8d5640d946a4aa \
  --connection-string="postgresql://user:pass@host:port/db"
```

### Neo4j Cloud

Neo4j is accessed directly via bolt protocol (no Hyperdrive).

**Configuration stored in secrets:**
- `NEO4J_URI`: neo4j+s://xxxxx.databases.neo4j.io
- `NEO4J_USER`: neo4j
- `NEO4J_PASSWORD`: [secret]

---

## 📊 Monitoring & Observability

### Health Checks

```bash
# Frontend health
curl https://argus.knogin.com/api/health

# Middleware health (worker + container)
curl https://api.knogin.com/health

# Middleware worker-only health
curl https://api.knogin.com/health/worker

# Middleware raw container health
curl https://api.knogin.com/health/raw

# Auth service health
curl https://auth.knogin.com/health
```

### Live Logs

```bash
# fe2 logs
cd /mnt/development/fe2/fe2
npx wrangler tail fe2

# Middleware logs
cd /mnt/development/argus_middleware/argus_middleware/cloudflare-workers
npx wrangler tail --format pretty

# Auth service logs
cd /mnt/development/auth_service/cloudflare-workers
npx wrangler tail
```

### Cloudflare Dashboard

Access detailed metrics at: https://dash.cloudflare.com

**Key Metrics:**
- Request volume
- Error rates (4xx, 5xx)
- Response times (p50, p95, p99)
- CPU time usage
- Memory usage
- Durable Object analytics
- Hyperdrive connection pool usage

---

## 🐛 Troubleshooting

### Common Issues

#### 1. Authentication Failures (401 Unauthorized)

**Symptoms:** GraphQL queries return 401 errors

**Possible Causes:**
- SECRET_KEY mismatch between auth_service and argus_middleware
- JWT token expired
- Cookie not being sent
- Cookie domain configuration

**Debug Steps:**
```bash
# Verify secrets are set
cd /mnt/development/argus_middleware/argus_middleware/cloudflare-workers
npx wrangler secret list | grep SECRET_KEY

cd /mnt/development/auth_service/cloudflare-workers
npx wrangler secret list | grep SECRET_KEY

# Check middleware logs for JWT validation errors
npx wrangler tail --format pretty | grep -i "jwt\|auth"

# Test authentication flow
curl -c cookies.txt https://auth.knogin.com/v1/portal/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# Use saved cookie
curl -b cookies.txt https://api.knogin.com/api/v1/auth/me
```

#### 2. Database Connection Errors

**Symptoms:** 500 errors, "database connection failed" in logs

**Possible Causes:**
- Database secrets not configured
- Hyperdrive misconfigured
- Firewall blocking connections
- Connection pool exhausted

**Debug Steps:**
```bash
# Verify database secrets are set
npx wrangler secret list | grep -E "POSTGRES|NEO4J"

# Check Hyperdrive status
npx wrangler hyperdrive get a45ec90abb6c4d899e8d5640d946a4aa

# Test database connectivity (check logs)
curl https://api.knogin.com/health
npx wrangler tail --format pretty | grep -i "database\|postgres\|neo4j"
```

#### 3. Frontend Build Failures

**Symptoms:** Build fails with module not found errors

**Common Causes:**
- Dependencies not installed
- Workspace packages not built
- Missing @opennextjs/cloudflare

**Solutions:**
```bash
cd /mnt/development/fe2/fe2

# Ensure all dependencies installed
npm install

# Build workspace packages first
npm run build:packages

# Ensure web dependencies installed
cd apps/web && npm install && cd ../..

# Clean build
rm -rf apps/web/.open-next apps/web/.next
cd apps/web && npm run build:cloudflare:production
```

#### 4. Container Startup Failures

**Symptoms:** Container health check fails, returns 500

**Debug Steps:**
```bash
# Check worker logs for container errors
npx wrangler tail --format pretty

# Common issues:
# - Missing secrets (check SECRET_KEY, database credentials)
# - Python import errors (check logs for ImportError)
# - Database connection failures
```

#### 5. SSO Authentication Errors

**Symptoms:** 
- Error: `'NoneType' object has no attribute 'authorize_redirect'`
- SSO login buttons don't work
- 503 errors when trying to use Google/Microsoft login

**Root Cause:** OAuth credentials not configured as Cloudflare secrets

**Required Secrets for SSO:**
```bash
cd /mnt/development/auth_service/cloudflare-workers

# For Google SSO
echo "your-google-client-id" | npx wrangler secret put GOOGLE_CLIENT_ID
echo "your-google-client-secret" | npx wrangler secret put GOOGLE_CLIENT_SECRET

# For Microsoft SSO
echo "your-microsoft-client-id" | npx wrangler secret put MICROSOFT_CLIENT_ID
echo "your-microsoft-client-secret" | npx wrangler secret put MICROSOFT_CLIENT_SECRET

# Note: AZURE_AD_TENANT_ID is already set in wrangler.jsonc vars to "common"
```

**Verify SSO Configuration:**
```bash
# Check which secrets are configured
cd /mnt/development/auth_service/cloudflare-workers
npx wrangler secret list

# After deployment, check available providers
curl https://auth.knogin.com/v1/portal/sso/available-providers

# For superuser - detailed SSO config status
curl -H "Cookie: argus_access_token=YOUR_TOKEN" \
  https://auth.knogin.com/v1/portal/sso/config-status
```

**Where to get OAuth credentials:**
- Google: https://console.cloud.google.com/apis/credentials
- Microsoft: https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps

**Code Changes (already implemented):**
- Added `get_configured_providers()` helper that validates credentials exist
- Updated SSO endpoints to return 503 if provider not configured (not 500)
- Added `/v1/portal/sso/available-providers` endpoint for frontend
- Added `/v1/portal/sso/config-status` admin endpoint for debugging

**Alternative - Disable SSO:**
If you don't need SSO, update `wrangler.jsonc`:
```jsonc
"vars": {
  "ENABLED_SSO_PROVIDERS": "[]"  // Empty array disables SSO
}
```

#### 6. Cold Start Performance

**Symptoms:** First request very slow (~60-70 seconds)

**This is normal behavior** for Cloudflare Workers Containers:
- First request initializes the Durable Object
- Subsequent requests are fast (< 1 second)
- Containers stay warm for ~15 minutes of idle time

**Optimization options:**
- Keep containers warm with periodic health checks
- Optimize Docker image size
- Use Workers for Platforms for tenant-specific routing

---

## 🔄 Rollback Procedures

### Rollback fe2

```bash
cd /mnt/development/fe2/fe2

# List recent deployments
npx wrangler deployments list

# Rollback to previous deployment
npx wrangler rollback [DEPLOYMENT_ID]

# Or redeploy a specific version from git
git checkout <previous-commit>
npm run build:packages
cd apps/web
npm run build:cloudflare:production
npm run deploy:production
```

### Rollback argus_middleware

```bash
cd /mnt/development/argus_middleware/argus_middleware/cloudflare-workers

# List deployments
npx wrangler deployments list

# Rollback
npx wrangler rollback [DEPLOYMENT_ID]
```

### Rollback auth_service

```bash
cd /mnt/development/auth_service/cloudflare-workers

# List deployments
npx wrangler deployments list

# Rollback
npx wrangler rollback [DEPLOYMENT_ID]
```

---

## 🛡️ Security Best Practices

### 1. Secret Rotation

Rotate sensitive secrets regularly:

```bash
# Generate new SECRET_KEY
NEW_SECRET=$(openssl rand -base64 32)

# Update in both services
cd /mnt/development/auth_service/cloudflare-workers
echo $NEW_SECRET | npx wrangler secret put SECRET_KEY

cd /mnt/development/argus_middleware/argus_middleware/cloudflare-workers
echo $NEW_SECRET | npx wrangler secret put SECRET_KEY
```

### 2. Database Credentials

- Store credentials only in Cloudflare secrets, never in code
- Use Hyperdrive for PostgreSQL connection pooling and security
- Rotate database passwords quarterly
- Use SSL for all database connections

### 3. Cookie Security

The `argus_access_token` cookie is configured with:
- Domain: `.knogin.com` (works across subdomains)
- SameSite: `lax`
- Secure: `true` (HTTPS only)
- HttpOnly: `true` (not accessible via JavaScript)

### 4. CORS Configuration

All services have coordinated CORS origins:
```
https://auth.knogin.com
https://argus.knogin.com
https://api.knogin.com
http://localhost:3000  # Development only
```

---

## 📈 Performance Optimization

### 1. Caching Strategy

**GraphQL Query Caching:**
- Introspection queries: 1 hour TTL
- Regular queries: 5 minutes TTL
- Use Cloudflare KV for edge caching

**Static Asset Caching:**
- Cloudflare automatically caches static assets
- Configure cache headers in Next.js

### 2. Connection Pooling

Hyperdrive automatically manages PostgreSQL connections:
- Max 24 connections to database
- Connection reuse across requests
- Regional routing for optimal latency

### 3. Smart Placement

Workers configured with `placement.mode = "smart"`:
- Routes requests to nearest data center
- Optimizes for latency and compute efficiency

---

## 🆘 Support Resources

### Documentation Links

- **Cloudflare Workers**: https://developers.cloudflare.com/workers/
- **Cloudflare Hyperdrive**: https://developers.cloudflare.com/hyperdrive/
- **Wrangler CLI**: https://developers.cloudflare.com/workers/wrangler/
- **OpenNext.js**: https://opennext.js.org/cloudflare

### Internal Documentation

- **DEPLOYMENT_COMPARISON.md**: ⭐ Detailed comparison of Workers vs Containers deployment (repo root)
- **AI_MASTER_GUIDE.md**: Core development principles
- **DATABASE_CONNECTION_GUIDE.md**: Database setup and troubleshooting
- **fe2/fe2/docs/CLOUDFLARE_DEPLOYMENT.md**: Detailed fe2 deployment guide (see FE2 repo)
- **argus_middleware/argus_middleware/cloudflare-workers/MIGRATION_GUIDE.md**: Middleware container guide
- **argus_middleware/argus_middleware/CONTRIBUTING.md**: Python coding standards with ruff

### Emergency Contacts

For production issues:
1. Check service health endpoints
2. Review Cloudflare dashboard for alerts
3. Check worker logs with `wrangler tail`
4. Review this guide's troubleshooting section

---

## 📝 Maintenance Checklist

### Daily
- [ ] Monitor error rates in Cloudflare dashboard
- [ ] Check worker CPU/memory usage

### Weekly
- [ ] Review worker logs for anomalies
- [ ] Check Hyperdrive connection pool metrics
- [ ] Verify all health endpoints responding

### Monthly
- [ ] Review and rotate API keys
- [ ] Update dependencies in all services
- [ ] Review and optimize worker performance
- [ ] Audit secret usage with `wrangler secret list`

### Quarterly
- [ ] Rotate database passwords
- [ ] Rotate JWT SECRET_KEY
- [ ] Review and update CORS origins
- [ ] Audit Cloudflare dashboard analytics

---

**Last Updated**: 2025-10-31  
**Maintained By**: Development Team  
**Status**: ✅ Production-Ready
