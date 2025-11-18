---
title: Argus Platform - AI Agent Master Guide
description: Master reference for Argus AI agents covering repo paths, compliance rules, and operational checklists.
---

# Argus Platform - AI Agent Master Guide

**Version**: 4.0
**Last Updated**: 2025-10-28
**Status**: ✅ Master Reference for All AI Agents

---

## 📋 Quick Reference & Index

**This document provides overarching principles.** For detailed, service-specific instructions, use the documentation index in the root repo.

- **Start Here**: `AI_DOCUMENTATION_INDEX.md` in the repo root - Your map to all platform documentation
- **🚨 MANDATORY**: **[I18N & Accessibility Requirements](/guide/accessibility)** - Internationalization (EN/ES/FR) and WCAG 2.2 AAA accessibility compliance (100% required before merge)

---

## 🚨 CRITICAL: Core Setup & Rules (READ FIRST)

1.  **Correct Repository Paths**:
    -   **Middleware**: `/mnt/development/argus_middleware/argus_middleware/` (NOT `/mnt/development/argus_middleware/`)
    -   **Frontend**: `/mnt/development/fe2/fe2/` (NOT `/mnt/development/fe2/`)
    -   **Auth**: `/mnt/development/auth_service/` (Correct as-is)

2.  **System Configuration**:
    -   Local `sudo` password: `ken`
    -   Local PostgreSQL password: `ken` (for user `postgres`)

3.  **NEVER Create Summary Files**:
    -   Do NOT create `SESSION_SUMMARY.md`, `UPDATE_SUMMARY.md`, or similar files. They are clutter.
    -   Document changes in **commit messages** and **CHANGELOG.md** only.

---

## 🎯 Core Philosophy: The Golden Rules

1.  **Read Before You Edit**: Never change code without understanding the full context.
2.  **Minimal Changes Only**: Make the smallest possible change that solves the problem.
3.  **Follow Existing Patterns**: Match the architecture and style of the surrounding code.
4.  **Verify, Don't Assume**: Get concrete evidence (like error messages) before acting.
5.  **Respect Working Code**: If it works, there's probably a good reason for its structure.
6.  **Type Safety First**: Follow the comprehensive type safety rules in `TYPE_SAFETY_RULES.md` for all code.

---

## 🏗️ Platform Architecture

### Service Structure (Cloudflare-Native)

```
/mnt/development/
├── fe2/fe2/                  # Frontend (Next.js on Cloudflare Workers)
├── argus_middleware/argus_middleware/ # Backend API (FastAPI + GraphQL on Workers Containers)
├── auth_service/             # Authentication (FastAPI + JWT on Workers Containers)
├── state-service/            # Legacy state worker (superseded by middleware-managed endpoints)
├── TYPE_SAFETY_RULES.md      # ⭐ Comprehensive type safety guide
├── CLOUDFLARE_MANAGEMENT_GUIDE.md  # ⭐ Cloudflare deployment & operations
└── [documentation files]
```

**All services are deployed on Cloudflare Workers:**
- **fe2**: Next.js on Cloudflare Workers (via OpenNext.js adapter)
- **argus_middleware**: FastAPI in Cloudflare Workers Container (Durable Object)
- **auth_service**: FastAPI in Cloudflare Workers Container (Durable Object)
- **state-service**: Legacy Cloudflare Durable Objects bundle (see appendix). Functionality now proxied by middleware.

See **[Cloudflare Management Guide](/guide/deployment)** for deployment, secrets management, and troubleshooting.

### Data Architecture

**🔴 CRITICAL DATABASE RULE - PostgreSQL is Single Source of Truth:**

-   **PostgreSQL (via Cloudflare Hyperdrive)**: **SINGLE SOURCE OF TRUTH** for ALL data
    - Primary relational database on Digital Ocean
    - Accessed via **Cloudflare Hyperdrive** for connection pooling and edge caching
    - **ALL CREATE/UPDATE/DELETE operations MUST write to PostgreSQL FIRST**
    - **ALL READ operations for non-graph data MUST query PostgreSQL FIRST**
    - See `/mnt/development/argus_middleware/argus_middleware/app/utils/db_sync_utils.py` for helpers

-   **Neo4j**: Graph database **ONLY FOR RELATIONSHIPS** (Neo4j Aura Cloud)
    - **Neo4j is REPLICATED data, not source of truth**
    - Use ONLY for graph traversal queries (relationships, paths, connections)
    - Written SECOND after PostgreSQL succeeds
    - Neo4j failures must be logged as warnings only (PostgreSQL data is safe)
    - **NEVER read non-graph data from Neo4j - always query PostgreSQL first**
-   **Cloudflare Durable Objects**: Primary cache and state management for Workers Containers, proxied by **argus_middleware** at `https://api.knogin.com`:
    - `CacheObject`: Edge caching with TTL
    - `SessionObject`: User session management
    - `LockObject`: Distributed locking
    - `PubSubObject`: Cross-service event broadcasting
    - `CollaborationRoom`: Real-time collaboration (presence, cursors, WebSockets)
-   **Cloudflare KV**: Edge caching for GraphQL schemas, feature flags, and session data.
-   **Google Firestore**: Per-tenant feature flags and user-specific configuration.
-   **⚠️ NO REDIS**: This project **does not use Redis**. All caching has been migrated to Cloudflare infrastructure (Durable Objects, KV, and Hyperdrive).

### State Management

All services now route stateful operations through **argus_middleware** at `https://api.knogin.com`:
- **fe2**: Consumes collaboration WebSockets (`wss://api.knogin.com/collaboration/{roomId}`) and PubSub notifications via middleware
- **argus_middleware**: Hosts Durable Object logic, exposing REST and WebSocket endpoints for every service
- **auth_service**: Calls middleware-managed session/cache APIs instead of binding to a separate worker
- **Legacy note**: The standalone `state-service` worker is retired; do not add bindings to it.

---

## 🚦 CRITICAL Rules (Platform-Wide)

### 0. Database Architecture - PostgreSQL First (MANDATORY)
- **Rule**: PostgreSQL via Hyperdrive is the SINGLE SOURCE OF TRUTH for ALL data
- **Write Order**: PostgreSQL FIRST → Neo4j SECOND (replication only)
- **Read Priority**: Query PostgreSQL for all non-graph data
- **Error Handling**: Neo4j failures must NOT fail operations (log warnings only)
- **Helper Utility**: Use `/mnt/development/argus_middleware/argus_middleware/app/utils/db_sync_utils.py`
- **Reason**: Ensures data consistency, prevents dual-source-of-truth problems, maintains architectural integrity
- **See**: Data Architecture section above for complete rules

### 0.1. Type Safety (NEW - MANDATORY)
- **Rule**: ALL code must follow type safety rules in `TYPE_SAFETY_RULES.md`.
- **Python**: Use SQLAlchemy `Mapped[]` annotations, proper return types, avoid `strawberry.scalars.JSON` as type.
- **TypeScript**: Use `next-intl` (not `react-i18next`), main package imports only, proper key props.
- **Reason**: Prevents 4000+ type errors, catches bugs at development time, improves code quality.

### 0.2. Access Control & RBAC (MANDATORY - ALL SERVICES)
**Status**: Phase 3 - 100% COMPLETE ✅ (Testing & Validation Complete)
**Phase 2**: 100% COMPLETE - All 63 services accounted for
**Phase 3**: 100% COMPLETE - Testing, security validation, monitoring deployed
**Last Updated**: 2025-11-04

#### Phase 2 Final Status

**✅ Services with Full Access Control (48 services):**

*Batches 1-8 - Modified Services (18):*
- ip_address, phone, url, malware, vehicle, campaign
- mission_plan, resource, operational_step
- geofence, media, source, vulnerability
- region, security_system, contingency_plan, graph, redaction

*Already Implemented (30+):*
- Core: location, person, organisation, report, target, alert, threat_actor, note, evidence_object, datasource, device, digital_footprint
- Domain: analytics, dashboard, entity, profile, case
- Doc services (8): doc_alert, doc_audit, doc_config, doc_incident, doc_location, doc_notification, doc_provider, doc_traveler

**✅ Services with Alternative Tenant Isolation (6 services):**
- Monitoring: monitor, observability, performance (use `_extract_tenant_id()`)
- Export/Legal: export, disclosure (use `_extract_tenant_id()`)
- Court: court_filing (uses `getattr(user, "tenant_id")`)

**✅ Services Not Requiring AC - System/External (9 services):**
- External Polling: aviation, maritime, blockchain, sanctions (no user queries - system polling only)
- External APIs: indicator, intelligence (provider API calls only)
- Infrastructure: correlation (algorithm service), connector_registry, ingestion_pipeline (have own tenant isolation)

**Total: 48 + 6 + 9 = 63 services ✅**

*Doc Services - All Tenant-Isolated (8):*
- doc_alert, doc_audit, doc_config, doc_incident, doc_location, doc_notification, doc_provider, doc_traveler

**🔍 Common Bug Pattern Found & Fixed:**
Many services called `build_neo4j_access_filters(user, "node")` but didn't properly unpack the returned tuple:

```python
# ❌ WRONG (bug found in 14 services):
access_filter = build_neo4j_access_filters(user, "n")
query = f"MATCH (n:Node) WHERE {access_filter} RETURN n"  # Passes tuple as string!

# ✅ CORRECT (fixed in all services):
access_where, access_params = build_neo4j_access_filters(user, "n")
if access_where:
    query = f"MATCH (n:Node) WHERE {access_where} RETURN n"
    params = {**existing_params, **access_params}
```

**✅ All Modified Services Validated:**
- 18 services modified with fixes
- 30+ services verified already complete
- 6 services with alternative isolation
- 9 services system/external (no user queries)
- **Compilation status: ZERO ERRORS**
- **Coverage: 100% (63/63 services)**

**📝 Phase 2 Complete!**
All services now have proper access control, tenant isolation, or documented reasons for exclusion.

**🚫 Services Not Requiring AC:**
- External API services: aviation, maritime, blockchain, indicator (provider queries)
- Utility services: shorturl (user-scoped), correlation, disclosure (infrastructure)
- Infrastructure: connector_registry, ingestion_pipeline (both have tenant isolation)

**📝 Remaining Work (~15 services):**
- Monitoring/observability services (monitor, observability, performance - likely system-level, no user filtering)
- Specialized services (provider, osint, external_data - external APIs)
- Review/queue services (review_queue, quarantine, briefing_partner, playbooks - workflow infrastructure)
- Remaining core services requiring verification

#### Core Principles
1. **Multi-Tenant Isolation**: Users can ONLY see data from their tenant (organization)
2. **Superuser Bypass**: Superusers (`is_superuser=True`) can access ALL tenants
3. **Secrecy Level Enforcement**: Users can only see data at or below their clearance level
4. **Country Restrictions**: Location/target entities filtered by user's accessible countries
5. **Organization Sharing**: Data can be shared at organization level when appropriate

#### Critical Fixes Applied
1. ✅ **User Model**: Added `secrecy_level_int` computed property (0-7) for proper comparisons
2. ✅ **Neo4j Queries**: Changed from string comparisons to integer (`secrecy_level_int <= $level`)
3. ✅ **Centralized Utilities**: Standardized to use `build_postgresql_access_filters()` and `build_neo4j_access_filters()`
4. ✅ **Query-Level Filtering**: Moved from post-fetch filtering to query WHERE clauses (better performance)
5. ✅ **Country Access Validation**: Added Pydantic validator with format documentation

#### Country Access Format
User `country_access` field accepts:
- **ISO 3166-1 alpha-2**: `"US"`, `"GB"`, `"CA"` (2 uppercase letters)
- **ISO 3166-1 alpha-3**: `"USA"`, `"GBR"`, `"CAN"` (3 uppercase letters)
- **Region wildcards**: `"region:Europe"`, `"region:Asia"`, `"region:MiddleEast"`
- **Global wildcard**: `"*"` (all countries)
- **Example**: `["US", "CA", "GB", "region:Europe", "*"]`

#### Implementation Rules (ALL database methods)

**Every GET/LIST/RETRIEVE method MUST:**
```python
async def get_item(self, item_id: str, user: User) -> Item | None:
    # 1. Check superuser bypass first
    if should_bypass_restrictions(user):
        # Superuser: no filtering
        query = "SELECT * FROM items WHERE id = %s"
        params = (item_id,)
    else:
        # 2. Apply tenant isolation
        accessible_tenant_ids = get_accessible_tenant_ids(user)
        query = "SELECT * FROM items WHERE id = %s AND tenant_id = ANY(%s)"
        params = (item_id, accessible_tenant_ids)
    
    records = await self.postgresql.execute_query(query, params)
    return Item(**dict(records[0])) if records else None
```

**Every CREATE method MUST auto-assign tenant:**
```python
async def create_item(self, data: ItemCreate, user: User) -> Item:
    # Auto-assign tenant_id from user
    tenant_id = user.tenant_id or user.organization_id or "default-tenant"
    
    new_item = Item(
        **data.model_dump(),
        tenant_id=tenant_id,
        created_by=user.id,
        created_at=datetime.now(UTC)
    )
    # ... insert with tenant_id
```

**For Neo4j queries:**
```python
async def list_nodes(self, user: User) -> list[Node]:
    # Build access filters with WHERE clause
    access_filters = build_neo4j_access_filters(user, "Node")
    
    query = f"""
        MATCH (n:Node)
        WHERE {access_filters['where_clause']}
        RETURN n
    """
    params = access_filters['params']
    records = await self.neo4j.execute_query(query, params)
    return [Node(**r['n']) for r in records]
```

#### Access Control Utilities (`app/utils/access_control_utils.py`)

**Available Functions:**
- `should_bypass_restrictions(user: User) -> bool` - Check if superuser
- `get_accessible_tenant_ids(user: User) -> list[str]` - Get user's accessible tenants
- `get_accessible_countries(user: User) -> list[str]` - Get user's accessible countries  
- `filter_entities_by_country(entities, user, country_field)` - Filter by country access
- `build_neo4j_access_filters(user, node_label) -> dict` - Build Neo4j WHERE clause
- `build_postgresql_access_filters(user, table_name) -> dict` - Build PostgreSQL filters

### 0.2. Operations Log & SIEM (MANDATORY - ALL TENANTS)
**Status**: ✅ COMPLETE (Deployed 2025-11-05)
**Feature**: Tenant-facing operations and audit log for SIEM functionality

#### Overview
Every tenant has access to a comprehensive operations log showing:
- **Access Control Operations**: Who accessed what resources, when, and with what result
- **Security Events**: Denied access attempts, cross-tenant attempts, suspicious activity
- **Performance Metrics**: Operation duration, filter overhead, query performance
- **Audit Trail**: Complete compliance-ready audit log for SOC2/ISO27001

#### Database
**Table**: `tenant_operations_log`
```sql
CREATE TABLE tenant_operations_log (
    id UUID PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    user_id TEXT NOT NULL,
    user_email TEXT,
    user_roles TEXT[],
    operation_type TEXT NOT NULL,  -- 'access_check', 'create', 'update', 'delete', 'query'
    resource_type TEXT NOT NULL,   -- 'investigation', 'person', etc.
    resource_id TEXT,
    action TEXT NOT NULL,          -- 'list', 'get', 'create', 'update', 'delete'
    access_result TEXT NOT NULL,   -- 'allowed', 'denied', 'bypassed', 'filtered'
    bypass_reason TEXT,
    filter_applied BOOLEAN,
    duration_ms FLOAT,
    ip_address TEXT,
    user_agent TEXT,
    request_id TEXT,
    metadata JSONB
);
```

**Indexes**: 6 optimized indexes for fast queries (tenant+time, user, resource, result, operation, security)

#### Automatic Logging
All access control operations automatically persist to the operations log via `access_control_metrics.py`:

```python
from app.utils.access_control_metrics import track_access_control, AccessControlEvent

# Automatic logging with context manager
with track_access_control(user, AccessControlEvent.TENANT_FILTER):
    result = get_accessible_tenant_ids(user)
# ^ Automatically logs to database with timing, result, and metadata
```

#### API Endpoints
**REST API**:
- `GET /api/operations-log/entries` - Get operations log with filters
- `GET /api/operations-log/stats` - Get aggregated statistics
- `GET /api/operations-log/security-events` - Get security events only
- `POST /api/operations-log/export` - Export logs (CSV/JSON) for compliance

**GraphQL**:
```graphql
query {
  operationsLog(startDate: "2025-11-01", endDate: "2025-11-05", limit: 100) {
    id timestamp userEmail operationType resourceType accessResult durationMs
  }
  operationsStats(startDate: "2025-11-01", endDate: "2025-11-05") {
    totalOperations allowedOperations deniedOperations averageDurationMs
  }
}
```

#### Frontend
**Page**: `/operations` - Tenant-facing operations log viewer

**Features**:
- **Operations Timeline**: Chronological view of all operations with icons (✅ allowed, 🔴 denied, ⚡ bypassed)
- **Statistics Dashboard**: Quick stats (total ops, allowed/denied/bypassed, avg duration)
- **Security Events**: Highlighted view of denied access and suspicious activity
- **Filters**: Date range, operation type, resource type, user, access result
- **Export**: Download logs as CSV or JSON for compliance audits
- **Search**: Full-text search across logs (future enhancement)

#### Use Cases
1. **Compliance Auditing**: Export logs for SOC2, ISO27001, GDPR compliance
2. **Security Monitoring**: Review denied access attempts and cross-tenant violations
3. **Incident Response**: Investigate suspicious activity and access patterns
4. **User Support**: Troubleshoot "why can't I access X" questions with clear audit trail
5. **Performance Analysis**: Track operation durations and identify slow queries

#### Migration
Run SQL migration (non-Alembic to avoid breaking DB):
```bash
cd /mnt/development/argus_middleware
DB_NAME=argus_doc_test ./run_migration.sh
```

#### Documentation
- **Feature Spec**: `TENANT_OPERATIONS_LOG_FEATURE.md` - Complete 850+ line specification
- **User Guide**: How to use the operations page for security monitoring
- **API Docs**: REST and GraphQL endpoint documentation with examples

**Key Benefits**:
- ✅ SIEM self-service (tenants review own logs)
- ✅ Compliance-ready (SOC2, ISO27001, GDPR)
- ✅ Incident response (investigate suspicious activity)
- ✅ Transparency (users see exactly what's happening)
- ✅ Zero performance impact (async logging)

#### Enforcement Points
1. **Service Layer**: Primary enforcement - ALL database methods
2. **GraphQL Resolvers**: Secondary check via `@auth` decorators
3. **REST Endpoints**: Middleware enforces user context
4. **Data Export**: Must apply filters before generating exports

#### Testing Requirements
- Unit test: Verify tenant isolation (cross-tenant access fails)
- Unit test: Verify superuser bypass works
- Integration test: End-to-end workflow maintains access control
- Security test: Attempt to access another tenant's data (must fail)

#### Performance Guidelines
- Access control adds <5% query overhead
- Use database indexes on tenant_id columns
- Cache accessible_tenant_ids for request duration
- Batch operations maintain per-item access checks

### 1. Middleware: File Naming
- **Rule**: All files in `app/domains/` MUST follow the `{domain}_{type}.py` pattern.
- **Example**: `aviation_service.py`, `evidence_models.py`.
- **Reason**: Prevents critical import collisions across 60+ domains.

### 2. Middleware: Strawberry Enum Inheritance
- **Rule**: All GraphQL enums MUST inherit from Python's `enum.Enum`.
- **Example**: `class MyEnum(str, Enum): ...`
- **Reason**: Prevents service-crashing schema build failures.

### 3. Middleware: SQLAlchemy Reserved Names
- **Rule**: Never use `metadata` as a column name. Use a prefixed name and map it.
- **Example**: `entity_metadata = Column(JSON, name="metadata")`

### 4. Middleware: Database Session Imports
- **Rule**: Always import `get_db_session` from `app.core.database`.
- **Usage**: `db = get_db_session()` (it's a direct call, not a generator).

### 5. Frontend: Package Imports
- **Rule**: Use main package exports only. Never use sub-paths.
- **Example**: `import { Card } from '@argus/ui';` (NOT `@argus/ui/card`)
- **Reason**: Sub-path imports will fail the build, even if the file exists.

### 6. Frontend: React `key` Prop
- **Rule**: NEVER use an array index for a React `key`. Use a stable, unique ID from the data.
- **Example**: `<li key={item.id}>...</li>` (NOT `key={index}`)

### 7. Frontend: Graph Node Properties
- **Rule**: Access dynamic properties via the `properties` object.
- **Example**: `const risk = node.properties?.risk;` (NOT `node.risk`)

---

## 📋 MANDATORY WORKFLOWS

### 1. GitHub & ROADMAP Management
- **Rule**: A strict workflow is enforced for updating `ROADMAP.md` and linked GitHub issues.
- **Process**:
    1.  Update status in `ROADMAP.md` (`Planned` -> `In Progress`).
    2.  Update GitHub issue with progress regularly.
    3.  When complete, close the issue with a detailed summary.
    4.  **Immediately remove the completed item from `ROADMAP.md`** and add it to `CHANGELOG.md`.
- **Reference**: See `argus_middleware/argus_middleware/AI_INSTRUCTIONS.md` for the full workflow.

### 2. Feature Flag System (Firebase-Based)
- **Rule**: ALL new features (backend domains and frontend UI) MUST be integrated with the Firebase-based feature flag system.
- **Backend**: New domains must be registered in `app/core/feature_flags.py`.
- **Frontend**: New UI must be conditionally rendered using the `FeatureFlagContext` (`useFeatureFlag` hook or `<FeatureGate>` component).
- **Reference**: See `argus_middleware/AI_INSTRUCTIONS.md` and `fe2/fe2/AI_INSTRUCTIONS.md` for implementation details.

### 3. Pre-Commit Validation
- **Rule**: Before finishing any task, you MUST run the service-specific validation checklist and fix ALL errors.
- **Process**: Each service (`fe2`, `argus_middleware`) has a detailed, multi-step validation script covering linting, type-checking, schema validation, tests, and runtime checks.
- **Reference**: The full checklists are in the `AI_INSTRUCTIONS.md` for each service. **Do not skip this step.**

---

## 🔧 Service-Specific Guidelines

For detailed instructions, refer to the primary guide for each service.

### For Frontend Work (`fe2`)
- **Primary Guide**: `fe2/fe2/AI_INSTRUCTIONS.md`
- **Deployment**: **[Cloudflare Management Guide](/guide/deployment)**
- **Key Points**:
    -   Deployed on Cloudflare Workers using OpenNext.js adapter for Next.js
    -   Auth is external (`auth.knogin.com`)
    -   **Token Display Rule**: NEVER show AI model/vendor names in the UI. Only show `totalTokensUsed` and `processingCostUsd`.
    -   Build with `npm run build:cloudflare:production`
    -   Deploy with `npm run deploy:production`
    -   **State Access**: Calls middleware-hosted collaboration and PubSub endpoints at `https://api.knogin.com`
    -   **Collaboration**: WebSocket connection to `wss://api.knogin.com/collaboration/{roomId}`
    -   Follow the detailed pre-commit validation checklist.

### For Middleware Work (`argus_middleware`)
- **Primary Guide**: `argus_middleware/argus_middleware/AI_INSTRUCTIONS.md`
- **Deployment**: **[Cloudflare Management Guide](/guide/deployment)**
- **Key Points**:
    -   FastAPI + Strawberry GraphQL deployed as Cloudflare Workers Container (Durable Object)
    -   Domain-driven architecture with strict file naming: `{domain}_{type}.py`
    -   All new domains MUST be registered in the feature flag system
    -   Secrets managed via `npx wrangler secret put`
    -   Deploy with `./deploy-fixed.sh` from `cloudflare-workers/` directory (uses docker-wrapper.sh)
    -   **PubSub Integration**: Uses `app/core/pubsub_bridge.py` to publish events through middleware-managed PubSub endpoints
    -   **Cross-Service Events**: Broadcasts (alerts, notifications) publish to PubSub channels for consumption by fe2
    -   Follow the detailed `ROADMAP.md` and pre-commit validation workflows.

### For Auth Work (`auth_service`)
- **Primary Guide**: `auth_service/AI_INSTRUCTIONS.md` (redirects to master guide)
- **Deployment**: **[Cloudflare Management Guide](/guide/deployment)**
- **Key Points**:
    -   FastAPI service deployed as Cloudflare Workers Container for JWT-based authentication
    -   Handles Google and Microsoft SSO
    -   Sets the `argus_access_token` cookie used by `fe2` and `argus_middleware`
    -   **CRITICAL**: `SECRET_KEY` must match between auth_service and argus_middleware
    -   **State Access**: Relies on middleware-managed session/cache APIs (no direct Durable Object bindings)

### State Service (Legacy)
- The standalone `state-service` worker has been decommissioned.
- All functionality is routed through `argus_middleware` at `https://api.knogin.com`.
- Do **not** add new bindings or deploy `state-service`.

---

## 🔍 Debugging Guide

### Middleware Issues (Cloudflare Workers Container)
```bash
# Watch live container logs
cd /mnt/development/argus_middleware/argus_middleware/cloudflare-workers
npx wrangler tail --format pretty

# Check health endpoints
curl https://api.knogin.com/health
curl https://api.knogin.com/health/worker
curl https://api.knogin.com/health/raw
```
-   `{"worker":"ok","container":"ok"}` -> Success.
-   `ImportError` -> Likely a file naming or circular dependency issue.
-   `DuplicatedTypeName` -> A GraphQL type name is reused across domains.
-   `Attribute name 'metadata' is reserved` -> SQLAlchemy reserved name violation.
-   Database connection errors -> Check secrets with `npx wrangler secret list`

### Frontend Issues (Cloudflare Workers)
```bash
# Watch live worker logs
cd /mnt/development/fe2/fe2
npx wrangler tail fe2

# Build for Cloudflare
cd apps/web
npm run build:cloudflare:production

# Test locally with dev server
cd /mnt/development/fe2/fe2
npm run dev
```
-   `Module not found` -> Almost always an incorrect import path. Check for sub-path imports (e.g., `@argus/ui/card`).
-   `Cannot use client component in server component` -> Add `'use client'` directive.
-   Type errors on `node.risk` -> Access via `node.properties.risk`.
-   Build errors -> See **[Cloudflare Management Guide](/guide/deployment)** troubleshooting section.

### Auth Service Issues
```bash
# Watch live logs
cd /mnt/development/auth_service/cloudflare-workers
npx wrangler tail

# Check health and configuration
curl https://auth.knogin.com/health
curl https://auth.knogin.com/v1/portal/sso/providers
```

---

## ✅ Checklist Before Making Changes

- [ ] I have read `AI_DOCUMENTATION_INDEX.md` in the repo root to find all relevant docs.
- [ ] I have read the complete file(s) I am modifying.
- [ ] I have the exact error message with line numbers.
- [ ] I am following the mandatory workflows (Roadmap, Feature Flags).
- [ ] My change is minimal and follows existing patterns.
- [ ] I will run the full pre-commit validation checklist before finishing.
