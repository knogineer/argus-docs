---
title: Database Connection Guide
description: Connection details and operational rules for Argus PostgreSQL and Neo4j databases.
---

# Database Connection Guide

**Last Updated**: October 31, 2025  
**Status**: Active - PostgreSQL on Digital Ocean, Neo4j on Aura Cloud

This guide documents all database connections used in the Argus Intelligence Platform.

---

## Overview

The Argus platform uses:

1. **Production PostgreSQL** - **Digital Ocean Managed Database** (PostgreSQL 17.6) - Database: `argus_db`
   - Accessed via **Cloudflare Hyperdrive** from Workers for connection pooling and edge caching
2. **Local PostgreSQL** - Local development/testing - Database: `argus_doc_test`
3. **Neo4j Aura** - **Neo4j Aura Cloud** (Cloud-managed graph database) - Database: `neo4j`

---

## Cloudflare Hyperdrive Integration

**Hyperdrive** provides connection pooling and edge caching for PostgreSQL connections from Cloudflare Workers.

### Configuration

All Workers services (argus_middleware, auth_service, fe2) use Hyperdrive for database access.

**Hyperdrive Configuration** (in wrangler.toml):
```toml
[[hyperdrive]]
binding = "HYPERDRIVE"
id = "your-hyperdrive-id"
```

**Hyperdrive Setup**:
```bash
# Create Hyperdrive connection
npx wrangler hyperdrive create argus-postgres \
  --connection-string="postgresql://doadmin:YOUR_POSTGRES_PASSWORD@argus-master-do-user-4031547-0.g.db.ondigitalocean.com:25060/argus_db?sslmode=require"

# List Hyperdrive configurations
npx wrangler hyperdrive list

# Get Hyperdrive details
npx wrangler hyperdrive get <id>
```

### Using Hyperdrive in Workers

**From argus_middleware (Python)**:
```python
# Access via environment binding
hyperdrive_url = env.HYPERDRIVE.connectionString
engine = create_async_engine(hyperdrive_url)
```

**From fe2 (TypeScript)**:
```typescript
// Access via environment binding
const conn = await env.HYPERDRIVE.connect();
```

**Benefits**:
- Connection pooling (reduces connection overhead)
- Edge caching (faster queries)
- Automatic SSL/TLS handling
- Connection reuse across requests
- Regional optimization

---

## 1. Production PostgreSQL (Digital Ocean)

### Connection Details

- **Host**: argus-master-do-user-4031547-0.g.db.ondigitalocean.com
- **Port**: 25060
- **Database**: argus_db
- **User**: doadmin
- **Password**: YOUR_POSTGRES_PASSWORD
- **SSL Mode**: require
- **SSL CA Certificate**: /mnt/development/ca-certificate.crt
- **Version**: PostgreSQL 17.6

### Environment Variables

```bash
# Production PostgreSQL (Digital Ocean)
POSTGRES_HOST=argus-master-do-user-4031547-0.g.db.ondigitalocean.com
POSTGRES_PORT=25060
POSTGRES_DB=argus_db
POSTGRES_USER=doadmin
POSTGRES_PASSWORD=YOUR_POSTGRES_PASSWORD
POSTGRES_SSLMODE=require
POSTGRES_SSLROOTCERT=/path/to/ca-certificate.crt

# Connection string (with SSL)
DATABASE_URL=postgresql://doadmin:YOUR_POSTGRES_PASSWORD@argus-master-do-user-4031547-0.g.db.ondigitalocean.com:25060/argus_db?sslmode=require
```

### Direct Connection (psql)

```bash
# From local machine (requires SSL certificate)
PGPASSWORD='YOUR_POSTGRES_PASSWORD' psql \
  -h argus-master-do-user-4031547-0.g.db.ondigitalocean.com \
  -p 25060 \
  -U doadmin \
  -d argus_db \
  --set=sslmode=require \
  --set=sslrootcert=/mnt/development/ca-certificate.crt
```

### Python Connection

```python
import psycopg2
from dotenv import load_dotenv
import os

load_dotenv()

# Using DATABASE_URL (ensure it includes ?sslmode=require)
conn = psycopg2.connect(os.getenv('DATABASE_URL'))

# Or using individual parameters with SSL
conn = psycopg2.connect(
    host=os.getenv('POSTGRES_HOST'),
    port=os.getenv('POSTGRES_PORT'),
    database=os.getenv('POSTGRES_DB'),
    user=os.getenv('POSTGRES_USER'),
    password=os.getenv('POSTGRES_PASSWORD'),
    sslmode=os.getenv('POSTGRES_SSLMODE', 'require'),
    sslrootcert=os.getenv('POSTGRES_SSLROOTCERT')
)
```

### SQLAlchemy Connection (deprecated - use asyncpg)

```python
from sqlalchemy import create_engine
import os

# Async engine (recommended for FastAPI)
from sqlalchemy.ext.asyncio import create_async_engine

# Ensure DATABASE_URL includes ?sslmode=require
engine = create_async_engine(
    os.getenv('DATABASE_URL').replace('postgresql://', 'postgresql+asyncpg://'),
    echo=True,
    pool_size=5,
    max_overflow=5,  # Digital Ocean has max_connections=25, be conservative
    connect_args={
        'ssl': 'require',
        'server_settings': {
            'application_name': 'argus_middleware'
        }
    }
)
```

**Important**: Digital Ocean cluster has a limit of **25 max connections**. Configure connection pooling appropriately:
- Default pool_size: 5
- Max overflow: 5
- Total max: 10 connections per instance
- Monitor usage: Stay well below 25 total

### Common Queries

```sql
-- Check connection
SELECT current_database(), current_user, version();

-- List all tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'your_table_name'
ORDER BY ordinal_position;

-- Check extensions
SELECT * FROM pg_extension;

-- Check PostGIS version (if installed)
SELECT PostGIS_version();
```

---



## 2. Local PostgreSQL (Development/Testing)

### Connection Details

- **Host**: localhost (127.0.0.1)
- **Port**: 5432
- **Database**: argus_doc_test
- **User**: postgres (default) or ken
- **Password**: "ken" or system authentication

### Environment Variables (for testing)

```bash
# Local PostgreSQL (overrides for testing)
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=argus_doc_test
POSTGRES_USER=postgres
POSTGRES_PASSWORD=ken  # or your local postgres password

# Or use local connection string
DATABASE_URL=postgresql://postgres:ken@localhost:5432/argus_doc_test
```

### Direct Connection (psql)

```bash
# As postgres user
sudo -u postgres psql -d argus_doc_test

# With password authentication
PGPASSWORD=ken psql -h localhost -U postgres -d argus_doc_test

# Or using echo for sudo password
echo "ken" | sudo -S -u postgres psql -d argus_doc_test

# Connect as current user (if configured)
psql -d argus_doc_test
```

### Database Setup

```bash
# Create the database
sudo -u postgres psql -c "CREATE DATABASE argus_doc_test;"

# Create user (if needed)
sudo -u postgres psql -c "CREATE USER argus_user WITH PASSWORD 'your_password';"

# Grant privileges
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE argus_doc_test TO argus_user;"

# Enable PostGIS extension
sudo -u postgres psql -d argus_doc_test -c "CREATE EXTENSION IF NOT EXISTS postgis;"

# Verify PostGIS
sudo -u postgres psql -d argus_doc_test -c "SELECT PostGIS_version();"
```

### Python Connection

```python
import psycopg2
import os

# For local testing
conn = psycopg2.connect(
    host='localhost',
    port=5432,
    database='argus_doc_test',
    user='postgres',
    password='ken'
)

# Or use environment variable override
os.environ['POSTGRES_DB'] = 'argus_doc_test'
conn = psycopg2.connect(os.getenv('DATABASE_URL'))
```

### Running Tests

```python
# In test files, override database
import os
os.environ['POSTGRES_DB'] = 'argus_doc_test'

# Example from test_doc_module_integration.py
def setup_test_env():
    os.environ['POSTGRES_DB'] = 'argus_doc_test'
    os.environ['POSTGRES_HOST'] = 'localhost'
    # Run tests against local database
```

### Schema Inspection

```bash
# Check all tables
echo "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;" | sudo -u postgres psql -d argus_doc_test

# Check specific table columns
echo "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'doc_incidents' ORDER BY ordinal_position;" | sudo -u postgres psql -d argus_doc_test

# Export schema
sudo -u postgres pg_dump -d argus_doc_test --schema-only > argus_doc_test_schema.sql
```

---

### 📍 Neo4j Aura (Graph Database)

**Connection Details:**
- **URI:** `neo4j+s://291e73cd.databases.neo4j.io`
- **Username:** `neo4j`
- **Password:** `YOUR_NEO4J_PASSWORD`
- **Database:** `neo4j`
- **Protocol:** Bolt with TLS/SSL (`neo4j+s://`)
- **Instance ID:** `291e73cd`
- **Instance Name:** `argus-main`
- **Console:** https://console.neo4j.io

**Environment Variables:**
```bash
NEO4J_URI=neo4j+s://291e73cd.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=YOUR_NEO4J_PASSWORD
NEO4J_DATABASE=neo4j
AURA_INSTANCEID=291e73cd
AURA_INSTANCENAME=argus-main
```
### Direct Connection (cypher-shell)

```bash
# From local machine with Neo4j CLI installed
cypher-shell -a neo4j+s://291e73cd.databases.neo4j.io \
  -u neo4j \
  -p "YOUR_NEO4J_PASSWORD" \
  'MATCH (n) RETURN count(n);'
```

### Python Connection

```python
from neo4j import GraphDatabase
import os

driver = GraphDatabase.driver(
    os.getenv('NEO4J_URI'),
    auth=(os.getenv('NEO4J_USER'), os.getenv('NEO4J_PASSWORD'))
)

with driver.session() as session:
    result = session.run("MATCH (n) RETURN count(n) as count")
    print(result.single()['count'])

driver.close()
```

---

## Database Selection Strategy

### When to Use Production PostgreSQL (Digital Ocean)

- Running production migrations
- Accessing production data
- Deploying to production
- Integration testing against real data (with caution)
- Populating seed data for demos

**Important**: Connection requires SSL certificate and proper credentials.

### When to Use Local PostgreSQL (argus_doc_test)

- Unit testing
- Integration testing
- Local development
- Schema validation
- Testing migrations before production
- Running test suites (pytest)
- Debugging database queries

### Environment Switching

```python
# In your code, check environment
import os

if os.getenv('ENVIRONMENT') == 'production':
    # Use production database
    db_url = os.getenv('DATABASE_URL')
else:
    # Use local test database
    db_url = 'postgresql://postgres:ken@localhost:5432/argus_doc_test'
```

---

## Alembic Migrations

### Production Migrations

```bash
# Set environment to production
export POSTGRES_HOST=argus-master-do-user-4031547-0.g.db.ondigitalocean.com
export POSTGRES_PORT=25060
export POSTGRES_DB=argus_db
export POSTGRES_USER=doadmin
export POSTGRES_PASSWORD='YOUR_POSTGRES_PASSWORD'
export POSTGRES_SSLMODE=require

# Run migrations
cd argus_middleware/argus_middleware
alembic upgrade head

# Create new migration
alembic revision --autogenerate -m "describe_changes"

# Check current version
alembic current

# Check if database is up to date
alembic check
```

### Local Testing Migrations

```bash
# Set environment to local
export POSTGRES_DB=argus_doc_test
export POSTGRES_HOST=localhost

# Run migrations on local database
cd argus_middleware/argus_middleware
alembic upgrade head

# Test migration rollback
alembic downgrade -1
alembic upgrade head
```

---

## Connection Testing

### Automated Test Script

Run the comprehensive connection test script:

```bash
# Test all database connections
python test_database_connections.py

# Expected output:
# ✅ Production PostgreSQL: Connected
# ✅ Local PostgreSQL: Connected  
# ✅ DATABASE_URL: Connected
```

This script tests:
- Production PostgreSQL connection
- Local PostgreSQL connection
- DATABASE_URL environment variable
- PostGIS extension availability
- Table counts and basic queries

### Quick Health Checks

```bash
# Test production PostgreSQL (Digital Ocean)
PGPASSWORD='YOUR_POSTGRES_PASSWORD' psql \
  -h argus-master-do-user-4031547-0.g.db.ondigitalocean.com \
  -p 25060 \
  -U doadmin \
  -d argus_db \
  --set=sslmode=require \
  -c 'SELECT version();'

# Test local PostgreSQL
echo "ken" | sudo -S -u postgres psql -d argus_doc_test -c 'SELECT 1;'

# Test Neo4j Aura
cypher-shell -a neo4j+s://291e73cd.databases.neo4j.io \
  -u neo4j \
  -p "YOUR_NEO4J_PASSWORD" \
  'RETURN 1;'
```

### Python Health Check Script

```python
#!/usr/bin/env python3
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

def test_production_postgres():
    try:
        conn = psycopg2.connect(
            host='argus-master-do-user-4031547-0.g.db.ondigitalocean.com',
            port=25060,
            database='argus_db',
            user='doadmin',
            password='YOUR_POSTGRES_PASSWORD',
            sslmode='require'
        )
        cursor = conn.cursor()
        cursor.execute('SELECT version();')
        version = cursor.fetchone()[0]
        print(f'✅ Production PostgreSQL: Connected')
        print(f'   Version: {version}')
        conn.close()
    except Exception as e:
        print(f'❌ Production PostgreSQL: {e}')

def test_local_postgres():
    try:
        conn = psycopg2.connect(
            host='localhost',
            port=5432,
            database='argus_doc_test',
            user='postgres',
            password='ken'
        )
        cursor = conn.cursor()
        cursor.execute('SELECT version();')
        print('✅ Local PostgreSQL: Connected')
        conn.close()
    except Exception as e:
        print(f'❌ Local PostgreSQL: {e}')

if __name__ == '__main__':
    test_production_postgres()
    test_local_postgres()
```

---

## Troubleshooting

### Connection Refused

```bash
# Check if PostgreSQL is running (local)
sudo systemctl status postgresql

# Start PostgreSQL (local)
sudo systemctl start postgresql

# Check if port is open (remote)
nc -zv crawler.knogin.com 5432
```

### Authentication Failed

```bash
# Check pg_hba.conf (local)
sudo cat /etc/postgresql/*/main/pg_hba.conf

# Ensure password authentication is enabled
# Should have line: host all all 0.0.0.0/0 md5
```

### Database Does Not Exist

```bash
# List all databases
sudo -u postgres psql -l

# Create missing database
sudo -u postgres psql -c "CREATE DATABASE argus_doc_test;"
```

### Permission Denied

```bash
# Grant privileges to user
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE argus_doc_test TO postgres;"

# Or grant to specific user
sudo -u postgres psql -d argus_doc_test -c "GRANT ALL ON ALL TABLES IN SCHEMA public TO argus_user;"
```

---

## Security Best Practices

1. **Never commit credentials** - Use .env files (in .gitignore)
2. **Use environment variables** - Load from .env via python-dotenv
3. **Use SSL in production** - Add `?sslmode=require` to connection string
4. **Limit privileges** - Grant only necessary permissions
5. **Use read-only connections** for queries that don't modify data
6. **Rotate passwords** regularly for production databases

---

## Quick Reference

| Database | Host | Port | Database Name | User | Use Case |
|----------|------|------|---------------|------|----------|
| Production PostgreSQL | argus-master-do-user-4031547-0.g.db.ondigitalocean.com | 25060 | argus_db | doadmin | Production investigations, entities, profiles (requires SSL) |
| Local PostgreSQL | localhost | 5432 | argus_doc_test | postgres | Testing, development |
| Neo4j Aura | 291e73cd.databases.neo4j.io | - | neo4j | neo4j | Graph relationships (cloud-managed, SSL required) |
| Firebase | - | - | - | - | User authentication & management (single source of truth) |

**SSL Certificate Required**: Production PostgreSQL requires SSL certificate at `/mnt/development/ca-certificate.crt`  
**Neo4j Aura**: Uses neo4j+s:// protocol (SSL/TLS encrypted by default)  
**User Data**: Managed exclusively by Firebase Authentication. PostgreSQL contains NO user data.

---

## 📝 Database Migration History

### October 30, 2025 - Neo4j Migration to Aura

Migrated Neo4j from self-hosted instance (bolt://148.251.88.165:7687) to Neo4j Aura cloud (neo4j+s://291e73cd.databases.neo4j.io).
- ✅ 78 nodes migrated
- ✅ 437 relationships migrated  
- ✅ 15 constraints recreated
- ✅ All application code updated for SSL

**See:** `/mnt/development/NEO4J_AURA_MIGRATION_COMPLETE.md` for complete details.

### October 29, 2025 - PostgreSQL Migration to Digital Ocean

Migrated PostgreSQL from bare metal to Digital Ocean managed database.
- ✅ 60 tables migrated
- ✅ All row counts verified identical
- ✅ PostGIS extension verified
- ✅ Application code updated for SSL

---

## Additional Resources

- PostgreSQL Migration Plan (`POSTGRESQL_MIGRATION_PLAN.md` in repo root) - Complete migration documentation
- Migration Execution Checklist (`DB_MIGRATION_EXECUTION_CHECKLIST.md` in repo root) - Step-by-step migration guide
- Migration Secrets Audit (`DB_MIGRATION_SECRETS_AUDIT.md` in repo root) - All files requiring updates
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [PostGIS Documentation](https://postgis.net/documentation/)
- [Neo4j Documentation](https://neo4j.com/docs/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [Alembic Documentation](https://alembic.sqlalchemy.org/)
- [Digital Ocean Managed Databases](https://docs.digitalocean.com/products/databases/)

````
