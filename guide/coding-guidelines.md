---
title: Coding Guidelines for AI Agents
description: Standards for writing, reviewing, and maintaining code used by Argus AI agents.
---

# Coding Guidelines for AI Agents

**Version**: 3.1
**Last Updated**: 2025-10-24

## 🚨 CRITICAL: Before You Start

1. **Correct Repository Paths**:
   - Middleware: `/mnt/development/argus_middleware/argus_middleware/` (NOT `/mnt/development/argus_middleware/`)
   - Frontend: `/mnt/development/fe2/fe2/` (NOT `/mnt/development/fe2/`)
   - Auth: `/mnt/development/auth_service/`

2. **System Configuration**:
   - Local sudo password: `ken` (without quotes)
   - PostgreSQL local password: `ken` (for user `postgres`)

3. **NEVER Create Summary Files**:
   - Do NOT create `SESSION_SUMMARY.md`, `UPDATE_SUMMARY.md`, `CHANGES_SUMMARY.md`, or any other summary markdown files
   - They create clutter and are impossible to maintain
   - Document changes in commit messages and CHANGELOG.md only

## Core Principles

### 1. Read Before You Edit
- **ALWAYS** use the Read tool to view the ENTIRE file before making changes
- Never assume code structure - verify it first
- Count braces/brackets to understand scope
- Look for existing patterns and follow them

### 2. Minimal, Surgical Changes
- Make the SMALLEST change possible to fix the issue
- Use Edit tool's `old_string` → `new_string` for targeted fixes
- **NEVER** rewrite entire files or "reconstruct" code
- Preserve existing architecture and patterns

### 3. Verify, Don't Assume
- Get EXACT error messages with line numbers before fixing
- Don't diagnose problems without evidence
- If something looks "broken," it may be intentional - investigate first
- Use grep/find to search for patterns before claiming things are missing

### 4. 100% Lint Compliance Required
- **ZERO errors and ZERO warnings** is mandatory before committing
- Run `npm run lint` in fe2/apps/web - must pass with no issues
- **Accessibility is critical** - blocks people who need assistive technologies
- All interactive elements MUST have keyboard support (Enter/Space keys)
- All interactive elements MUST have `aria-label` using translation keys
- All form fields MUST have associated labels and ARIA attributes
- All media elements MUST have captions/transcripts
- No TypeScript `any` types without explicit justification
- Fix ALL unused variables - no exceptions

### 4.1. Accessibility Patterns (MANDATORY)

**Interactive Elements**:
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

**Form Fields**:
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

**Tab Interfaces** (WCAG 2.2 AAA):
```typescript
// ✅ CORRECT - Proper ARIA roles and keyboard navigation
<div role="tablist" aria-label={t('feature.ariaLabels.tabs')}>
  <button
    role="tab"
    aria-selected={activeTab === 'tab1'}
    aria-controls="panel-tab1"
    tabIndex={activeTab === 'tab1' ? 0 : -1}
    onClick={() => setActiveTab('tab1')}
  >
    {t('feature.tabs.tab1')}
  </button>
</div>
<div role="tabpanel" id="panel-tab1" aria-labelledby="tab-tab1">
  {/* Content */}
</div>
```

### 4.2. i18n Compliance (MANDATORY)
- **NEVER hardcode English strings** - use `t('key.path')` for ALL user-facing text
- Create feature-specific translation files in `/messages/en/[feature].json`
- Include `ariaLabels` section for all ARIA attributes
- Use interpolation for dynamic values: `t('key', { variable: value })`
- Translation file structure:
```json
{
  "labels": { "field": "Field Label" },
  "placeholders": { "field": "Enter field value" },
  "descriptions": { "field": "Field description" },
  "errors": { "fieldRequired": "Field is required" },
  "ariaLabels": { "fieldInput": "Field input for screen readers" }
}
```

### 4. Type Safety Rules

#### SQLAlchemy Reserved Names
- **NEVER** use `metadata` as a column name in SQLAlchemy models
- Use `<entity>_metadata` with `name="metadata"` parameter instead
- Example: `tenant_metadata = Column(JSON, default=dict, name="metadata")`

#### Database Session
- Import `get_db_session` not `get_db` from `app.core.database`
- Call it directly: `db = get_db_session()` (no `next()` wrapper)

#### GraphQL Schema
- Avoid duplicate type names across domains
- Use prefixes for clarity: `CatalogDataSourceType` not `DataSourceType`
- Update `__init__.py` exports when renaming types

#### Neo4j/Graph Types
- GraphNode has a `properties: Record<string, any>` field
- Access dynamic properties via `node.properties?.fieldName`
- Don't add arbitrary fields to canonical interfaces
- Example: Use `node.properties?.risk` not `node.risk`

### 5. Dependency Management
- This project uses **Cloudflare Durable Objects**, NOT Redis
- Don't add Redis dependencies or imports
- Check README.md for architecture decisions before adding packages

### 6. Error Resolution Process

When you encounter errors:

1. **Read** the complete file(s) involved
2. **Identify** the exact error with file path and line number
3. **Search** for existing patterns (how is this done elsewhere?)
4. **Propose** minimal change with old_string/new_string
5. **Wait** for approval before making changes
6. **Verify** the fix worked by checking logs/output

### 7. What NOT to Do

❌ "Reconstruct" or "rebuild" files
❌ Delete large blocks of code without verification
❌ Install packages without checking conflicts
❌ Assume code is "broken" or "fragmented"
❌ Make changes based on speculation
❌ Rewrite working code for "cleanliness"
❌ Add features that weren't requested
❌ Commit code with ANY lint errors or warnings
❌ Add `onClick` handlers without keyboard support (`onKeyDown`)
❌ Create interactive elements without ARIA labels
❌ Use `any` types without disabling the rule with justification
❌ Ignore accessibility warnings - they block real users

### 8. Git Workflow

- Read files before staging changes
- Make focused commits with clear messages
- Include context in commit messages about WHY the change was needed
- Push after each logical fix is complete
- Wait for deployment before declaring success

### 9. Debugging Middleware Issues

When checking argus-middleware-service:

```bash
# Check Cloudflare Workers logs
cd /mnt/development/argus_middleware/argus_middleware/cloudflare-workers
npx wrangler tail --format pretty

# Check health endpoints
curl https://api.knogin.com/health
curl https://api.knogin.com/health/worker
```

Look for:
- `Application startup complete` = success
- Import errors = missing/wrong imports
- SQLAlchemy errors = reserved names or type issues
- Strawberry errors = GraphQL schema conflicts

### 10. Common Patterns in This Codebase

#### Model Definition
```python
class MyModel(Base):
    __tablename__ = "my_table"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    config = Column(JSON, default=dict)
    entity_metadata = Column(JSON, default=dict, name="metadata")  # Avoid reserved name
```

#### GraphQL Resolver
```python
from app.core.database import get_db_session  # Not get_db

@strawberry.type
class MyQuery:
    @strawberry.field
    def my_field(self) -> MyType:
        db = get_db_session()  # Direct call, no next()
        # ... use db
```

#### Frontend Type Access
```typescript
// Canonical interface
interface GraphNode {
  id: string
  label: string
  properties: Record<string, any>  // Dynamic properties here
}

// Usage
const risk = node.properties?.risk as string | undefined
```

## Questions to Ask Before Changing Code

1. Have I read the entire file?
2. Do I have the exact error message?
3. Is this the minimal change needed?
4. Does this follow existing patterns in the codebase?
5. Am I preserving the original architecture?
6. Have I checked if this problem was solved elsewhere?
7. Will this break anything else?
8. **Does `npm run lint` pass with ZERO errors and ZERO warnings?**
9. **Are all interactive elements keyboard accessible (Enter/Space keys)?**
10. **Do all interactive elements have `aria-label` using translation keys?**
11. **Do all form fields have proper labels and ARIA attributes?**
12. **Are all user-facing strings using `t('key')` (no hardcoded English)?**
13. **Do all media elements have captions/transcripts?**
14. **Are there any TypeScript `any` types that should be fixed?**

## When in Doubt

- **Read more code** - the answer is usually already in the codebase
- **Ask for clarification** - don't guess the user's intent
- **Make smaller changes** - you can always do more in the next iteration
- **Trust existing code** - it was working before, respect that

---

Remember: Your job is to **fix specific issues**, not to **redesign the codebase**. When code looks unfamiliar or complex, that's usually intentional - understand it before changing it.
