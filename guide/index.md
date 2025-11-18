---
title: Development Environment - Argus Platform
description: Repository layout, environment prerequisites, and navigation instructions for Argus Platform development.
---

# Development Environment - Argus Platform

**Version**: 4.0
**Last Updated**: 2025-10-31
**Architecture**: Cloudflare-Native

This development environment is configured for the Cloudflare-native Argus Platform. All services are deployed on Cloudflare Workers infrastructure.

## 🚨 CRITICAL: Repository Structure

**IMPORTANT**: The actual code repositories are NESTED in subdirectories:

| Service | Actual Repository Path | ❌ Common Mistake |
|---------|------------------------|-------------------|
| Middleware | `/mnt/development/argus_middleware/argus_middleware/` | Accessing `/mnt/development/argus_middleware/` |
| Frontend | `/mnt/development/fe2/fe2/` | Accessing `/mnt/development/fe2/` |
| Auth | `/mnt/development/auth_service/` | N/A |

**Always navigate to the nested directory for middleware and frontend!**

## Production Architecture

All services are deployed on **Cloudflare Workers**:

- **Frontend**: https://argus.knogin.com (Next.js on Cloudflare Workers via OpenNext.js)
- **Middleware**: https://api.knogin.com (FastAPI in Workers Container - Durable Object)
- **Auth Service**: https://auth.knogin.com (FastAPI in Workers Container - Durable Object)

See **[Cloudflare Management Guide](/guide/deployment)** for complete deployment and operations documentation.

## System Configuration

- **Local sudo password**: `ken` (without quotes)
- **PostgreSQL local password**: `ken` (for user `postgres`)
- **NEVER create summary files**: Don't create `SESSION_SUMMARY.md`, `UPDATE_SUMMARY.md`, etc. - they create clutter

## Quick Start Documentation

1. **AI Instructions**: [AI Master Guide](/guide/ai-guide) - Start here for all development
2. **Documentation Index**: `AI_DOCUMENTATION_INDEX.md` - Find all guides
3. **i18n & Accessibility**: [I18N & Accessibility Requirements](/guide/accessibility) - **MANDATORY** WCAG 2.2 AAA & translation requirements
4. **Database Guide**: [Database Connection Guide](/guide/database) - PostgreSQL and Neo4j connections
5. **Cloudflare Guide**: [Cloudflare Management Guide](/guide/deployment) - Deployment and operations
6. **Type Safety**: [Type Safety Rules](/guide/type-safety) - Python and TypeScript type rules

## Infrastructure Overview

### Database Services

**PostgreSQL (Digital Ocean)**:
- Accessed via **Cloudflare Hyperdrive** for connection pooling and edge caching
- Host: argus-master-do-user-4031547-0.g.db.ondigitalocean.com:25060
- Database: `argus_db`
- Hyperdrive ID: `a45ec90abb6c4d899e8d5640d946a4aa`

**Neo4j (Aura Cloud)**:
- Graph database for entity relationships
- Console: https://console.neo4j.io
- Instance: argus-main

**See [Database Connection Guide](/guide/database) for complete connection details.**

### Cloudflare Services

- **Workers** - Edge compute for all services
- **Workers Containers (Durable Objects)** - FastAPI middleware and auth service
- **KV** - Edge caching for GraphQL schemas, feature flags, session data
- **D1** - SQLite at the edge
- **R2** - Object storage
- **Hyperdrive** - PostgreSQL connection pooling and caching
- **Workers AI** - AI model access

**⚠️ Note**: Redis is NOT used. All caching uses Cloudflare infrastructure (Durable Objects, KV, Hyperdrive).

## Service Health Checks

Test production services:

```bash
# Frontend
curl https://argus.knogin.com/api/health

# Middleware (Worker + Container)
curl https://api.knogin.com/health

# Middleware (Worker only)
curl https://api.knogin.com/health/worker

# Auth Service
curl https://auth.knogin.com/health

# GraphQL Endpoint
curl https://api.knogin.com/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __schema { queryType { name } } }"}'
```

## Local Development

### Frontend (fe2)
```bash
cd /mnt/development/fe2/fe2
npm install
npm run dev
```

To use a local PostgreSQL database instead of Cloudflare Hyperdrive when running locally (recommended for development):
```bash
cd /mnt/development/fe2/fe2
npm install
npm run dev:no-hyperdrive
```

### Middleware (argus_middleware)
```bash
cd /mnt/development/argus_middleware/argus_middleware
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Auth Service
```bash
cd /mnt/development/auth_service
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

## Deployment

See **[Cloudflare Management Guide](/guide/deployment)** for complete deployment procedures.

### Auto-Deploy Services (Push to Main)

**fe2 (Frontend)** and **argus_middleware (Backend)** automatically deploy via GitHub Actions when you push to the `main` branch:

```bash
# Simply commit and push - GitHub Actions handles deployment
git add .
git commit -m "feat: your changes"
git push origin main

# Monitor deployments:
# - fe2: https://github.com/your-org/fe2/actions
# - middleware: https://github.com/your-org/argus_middleware/actions
```

### Manual Deploy (Auth Service Only)

**auth_service** requires manual deployment for security review:

```bash
# Auth Service (manual only)
cd /mnt/development/auth_service/cloudflare-workers
./deploy.sh
```

### Manual Override (Emergency/Testing)

For emergency fixes or testing, you can manually deploy fe2 and middleware:

```bash
# Frontend (manual override)
cd /mnt/development/fe2/fe2/apps/web
npm run build:cloudflare:production
npm run deploy:production

# Middleware (manual override)
cd /mnt/development/argus_middleware/argus_middleware/cloudflare-workers
./deploy.sh
```

## Important Notes

- **Cloudflare-Native**: All services run on Cloudflare Workers infrastructure
- **Hyperdrive**: PostgreSQL accessed via Cloudflare Hyperdrive for connection pooling
- **No Bare Metal**: Migration from bare metal to Cloudflare completed October 2025
- **Shared Databases**: Development and production share databases - use transactions
- **Data Integrity**: Always test queries before execution
- **Security**: Never commit `.env` file, SSH keys, or secrets to version control
- **Secrets Management**: Use `npx wrangler secret put` for Cloudflare secrets

## Repository Services

| Directory | Service | Stack | Deployment |
|-----------|---------|-------|------------|
| `fe2/fe2/` | Frontend | Next.js 14, React 19, TypeScript | Cloudflare Workers (OpenNext.js) |
| `argus_middleware/argus_middleware/` | Backend API | FastAPI, Strawberry GraphQL, Python 3.12 | Cloudflare Workers Container |
| `auth_service/` | Authentication | FastAPI, JWT, Python 3.12 | Cloudflare Workers Container |
| `knogin-website/` | Marketing Site | Next.js | Cloudflare Pages |
| `state-service/` | Shared State | (Deprecated - migrated to Durable Objects) | N/A |

## Additional Resources

- **[AI Master Guide](/guide/ai-guide)** - Development principles and critical rules
- **[I18N & Accessibility Requirements](/guide/accessibility)** - **MANDATORY** internationalization (EN/ES/FR) and WCAG 2.2 AAA accessibility compliance
- **[Cloudflare Management Guide](/guide/deployment)** - Deployment, secrets, monitoring, troubleshooting
- **[Database Connection Guide](/guide/database)** - Database setup and connection details
- **[Type Safety Rules](/guide/type-safety)** - Type safety rules for Python and TypeScript
- **[Coding Guidelines](/guide/coding-guidelines)** - Code standards and patterns
- **GITHUB_ROADMAP_WORKFLOW_GUIDE.md** - ROADMAP and issue management

---

**For deployment and operational issues**: See [Cloudflare Management Guide](/guide/deployment)

**Last Updated**: 2025-10-31  
**Architecture**: Cloudflare-Native

## Development Guidelines

1. **Load environment variables** in your application
2. **Use parameterized queries** to prevent SQL injection
3. **Wrap operations in transactions** for data consistency
4. **Generate realistic test data** using Faker or similar libraries
5. **Check existing data** before creating duplicates
6. **Document your schema changes** in migration files
7. **i18n Compliance**: All user-facing strings MUST use translation keys (no hardcoded English)
8. **Accessibility Compliance**: WCAG 2.2 AAA required - all interactive elements keyboard accessible with ARIA labels

## Accessibility & i18n Patterns

### Interactive Elements (MANDATORY)
```typescript
// ❌ WRONG - Not keyboard accessible
<div onClick={handleClick}>Click me</div>

// ✅ CORRECT - Full keyboard support + i18n
<div
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }}
  role="button"
  tabIndex={0}
  aria-label={t('feature.ariaLabels.action')}
>
  {t('feature.actions.clickMe')}
</div>
```

### Form Fields (MANDATORY)
```typescript
// ✅ CORRECT - Full accessibility + i18n
<Label htmlFor="field-id">{t('feature.labels.field')}</Label>
<Input
  id="field-id"
  aria-label={t('feature.ariaLabels.fieldInput')}
  aria-describedby="field-desc"
  aria-invalid={!!error}
  aria-required={true}
/>
<p id="field-desc">{t('feature.descriptions.field')}</p>
{error && <p role="alert">{t('feature.errors.fieldRequired')}</p>}
```

### Translation File Structure
```json
{
  "labels": { "field": "Field Label" },
  "descriptions": { "field": "Field description" },
  "errors": { "fieldRequired": "Field is required" },
  "ariaLabels": { "fieldInput": "Field input for screen readers" }
}
```

## Support

For detailed connection examples, data insertion patterns, and troubleshooting, see the [Database Connection Guide](/guide/database).
