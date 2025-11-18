---
title: Type Safety Rules - Preventing Common Type Errors
description: Guardrails and examples to prevent type regressions across Argus services and tooling.
---

# 🛡️ Type Safety Rules - Preventing Common Type Errors

**Version**: 1.0
**Last Updated**: 2025-10-28
**Status**: ✅ Mandatory for all new code

This document provides comprehensive rules for maintaining type safety across all Argus Platform services.

---

## 📋 Table of Contents

1. [Python/argus_middleware Type Safety](#python-type-safety)
2. [TypeScript/fe2 Type Safety](#typescript-type-safety)
3. [Pre-Commit Type Checking](#pre-commit-validation)

---

## 🐍 Python Type Safety (argus_middleware)

### Rule 1: SQLAlchemy 2.0 Mapped[] Annotations

**CRITICAL**: All SQLAlchemy model columns MUST use `Mapped[]` type annotations for proper type checking.

#### ❌ WRONG - Old Column() syntax without type hints:
```python
from sqlalchemy import Column, String, Integer

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=True)
```

#### ✅ CORRECT - Mapped[] with proper type hints:
```python
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

class User(Base):
    __tablename__ = "users"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    email: Mapped[str | None] = mapped_column(String(255))
```

#### Common Patterns:

```python
# Required string field
name: Mapped[str] = mapped_column(String(255))

# Optional string field
description: Mapped[str | None] = mapped_column(Text)

# Integer with default
count: Mapped[int] = mapped_column(default=0)

# Enum field
status: Mapped[StatusEnum] = mapped_column(Enum(StatusEnum))

# JSON field
metadata: Mapped[dict] = mapped_column(JSON)

# Array field (PostgreSQL)
tags: Mapped[list[str]] = mapped_column(ARRAY(String))

# Foreign key
user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"))

# Relationship
user: Mapped["User"] = relationship("User", back_populates="items")
```

### Rule 2: Strawberry GraphQL JSON Types

**CRITICAL**: NEVER use `strawberry.scalars.JSON` as a type annotation. Use proper typing.

#### ❌ WRONG - Using strawberry.scalars.JSON:
```python
import strawberry

@strawberry.type
class MyType:
    data: strawberry.scalars.JSON  # ❌ mypy error: not valid as a type
```

#### ✅ CORRECT - Use typing.Any or specific dict types:
```python
import strawberry
from typing import Any

@strawberry.type
class MyType:
    data: strawberry.scalars.JSON = strawberry.field(default_factory=dict)  # For GraphQL schema
    
    # OR be more specific:
    metadata: dict[str, Any] = strawberry.field(default_factory=dict)
```

#### Best Practice - Define proper types:
```python
@strawberry.type
class EntityMetadata:
    confidence: float
    source: str
    extracted_at: str

@strawberry.type
class Entity:
    name: str
    metadata: EntityMetadata  # ✅ Typed, not JSON
```

### Rule 3: Function Return Type Annotations

**MANDATORY**: All functions MUST have explicit return type annotations.

#### ❌ WRONG - No return type:
```python
async def get_user(user_id: UUID):  # ❌ Missing return type
    return await db.query(User).filter(User.id == user_id).first()
```

#### ✅ CORRECT - Explicit return type:
```python
async def get_user(user_id: UUID) -> User | None:
    return await db.query(User).filter(User.id == user_id).first()
```

#### Common Patterns:
```python
# Single object or None
async def get_by_id(id: UUID) -> User | None: ...

# List of objects
async def get_all() -> list[User]: ...

# Boolean flag
def is_valid(data: dict) -> bool: ...

# No return value
async def delete(id: UUID) -> None: ...

# Strawberry resolver
@strawberry.field
async def user(self, info: Info, id: UUID) -> User | None: ...
```

### Rule 4: Avoid Legacy Imports

**CRITICAL**: Use correct import paths. These old modules don't exist:

#### ❌ WRONG - Legacy imports:
```python
from app.database import Base  # ❌ Doesn't exist
from app.exceptions import NotFoundError  # ❌ Doesn't exist
from app.auth import get_current_user  # ❌ Doesn't exist
```

#### ✅ CORRECT - Current imports:
```python
from app.core.database import Base, get_db_session
from app.dependencies import get_current_user
# Define custom exceptions locally or use standard Python exceptions
```

### Rule 5: Type Stubs for Third-Party Libraries

**MANDATORY**: Install type stubs for all production dependencies in `requirements.txt`:

```txt
# Type stubs (for mypy)
types-psutil
types-requests
types-redis
types-boto3

# Libraries with built-in stubs (no types- package needed)
geoalchemy2  # Has py.typed marker
```

**Never ignore missing imports for production code packages in mypy config.**

### Rule 6: Mypy Configuration

**Standard mypy config** (`pyproject.toml`):

```toml
[tool.mypy]
python_version = "3.12"
warn_return_any = false
warn_unused_configs = true
disallow_untyped_defs = false  # Gradually enable
check_untyped_defs = true
no_implicit_optional = true
warn_redundant_casts = true
warn_no_return = true
warn_unreachable = true
strict_equality = true
show_error_codes = true

# Only ignore third-party libraries without stubs
[[tool.mypy.overrides]]
module = [
    "strawberry.*",
    "neo4j.*",
    "firebase_admin.*",
    # ... only external libraries
]
ignore_missing_imports = true
```

**NEVER disable these globally:**
- `check_untyped_defs` - catches many real bugs
- `warn_unreachable` - identifies dead code
- `strict_equality` - prevents None comparison bugs

---

## 📘 TypeScript Type Safety (fe2)

### Rule 1: Consistent Translation Hooks

**CRITICAL**: Use ONLY `next-intl`, not `react-i18next`.

#### ❌ WRONG - Using react-i18next or empty namespace:
```typescript
import { useTranslation } from 'react-i18next'  // ❌ Wrong library

export function MyComponent() {
  const { t } = useTranslation(['common', 'errors'])  // ❌ Wrong API
  return <div>{t('errors:pages.serverError')}</div>
}

// Also wrong - empty namespace
const t = useTranslations()  // ❌ No namespace specified
return <div>{t('admin:dashboard.title')}</div>  // ❌ Redundant prefix
```

#### ✅ CORRECT - Using next-intl with namespace:
```typescript
import { useTranslations } from 'next-intl'  // ✅ Correct library

export function MyComponent() {
  const t = useTranslations('errors')  // ✅ Specify namespace
  return <div>{t('pages.serverError')}</div>  // ✅ No namespace prefix in key
}

// For multiple namespaces, use separate hooks
export function AdminDashboard() {
  const t = useTranslations('admin')  // ✅ Admin namespace
  const te = useTranslations('errors')  // ✅ Errors namespace
  
  return (
    <div>
      <h1>{t('dashboard.title')}</h1>  {/* ✅ No 'admin:' prefix */}
      <p className="error">{te('auth.unauthorized')}</p>  {/* ✅ No 'errors:' prefix */}
    </div>
  )
}
```

**Translation File Structure**:
- Files: `apps/web/messages/{en,es,fr}/*.json` (111 files per language)
- Namespaces: admin, errors, common, investigation, marketplace, etc.
- Build: `merge-messages.mjs` script merges individual files before build

**Key Rules**:
1. ALWAYS specify namespace: `useTranslations('namespace')`
2. NEVER use namespace prefix in keys: `t('key')` NOT `t('namespace:key')`
3. NEVER import from `lib/i18n` - this module doesn't exist (legacy code)
4. Use separate hooks for multiple namespaces
5. Translation files automatically merge during prebuild

**Why**: `next-intl` is the standard for Next.js 14+ App Router. It provides:
- Better SSR support
- Simpler API
- Type-safe keys (with config)
- Better performance

### Rule 2: Package Import Paths

**CRITICAL**: ONLY use main package exports, NEVER sub-path imports.

#### ❌ WRONG - Sub-path imports:
```typescript
import { Card } from '@argus/ui/card'  // ❌ Build fails
import { Button } from '@argus/ui/components/button'  // ❌ Module not found
```

#### ✅ CORRECT - Main package exports:
```typescript
import { Card, Button, Input } from '@argus/ui'  // ✅ Works
```

**Why**: Package exports are defined in `package.json` - sub-paths are not exposed.

### Rule 3: GraphQL Type Usage

**CRITICAL**: Use generated types from `@argus/graphql`, never inline types.

#### ❌ WRONG - Inline type definitions:
```typescript
interface Investigation {
  id: string
  title: string
  status: string
}

function MyComponent() {
  const [data, setData] = useState<Investigation>()
  // ...
}
```

#### ✅ CORRECT - Use generated types:
```typescript
import { Investigation } from '@argus/graphql'

function MyComponent() {
  const [data, setData] = useState<Investigation>()
  // ...
}
```

### Rule 4: React Key Props

**CRITICAL**: NEVER use array index as a React `key`.

#### ❌ WRONG - Index as key:
```typescript
{items.map((item, index) => (
  <ListItem key={index}>{item.name}</ListItem>  // ❌ Breaks React reconciliation
))}
```

#### ✅ CORRECT - Stable unique ID as key:
```typescript
{items.map((item) => (
  <ListItem key={item.id}>{item.name}</ListItem>  // ✅ Stable ID
))}
```

### Rule 5: Graph Node Property Access

**CRITICAL**: Access dynamic properties via `.properties` object.

#### ❌ WRONG - Direct property access:
```typescript
const risk = node.risk  // ❌ TypeScript error
const status = node.status  // ❌ Property doesn't exist
```

#### ✅ CORRECT - Via properties object:
```typescript
const risk = node.properties?.risk  // ✅ Typed correctly
const status = node.properties?.status  // ✅ Optional chaining
```

### Rule 6: Server/Client Component Boundaries

**CRITICAL**: Mark client-only code with `'use client'` directive.

#### ❌ WRONG - Client code in server component:
```typescript
// app/page.tsx - Server component by default
import { Card } from '@argus/ui'  // ❌ Client-only component

export default function Page() {
  return <Card>Content</Card>  // ❌ Build error
}
```

#### ✅ CORRECT - Add 'use client' directive:
```typescript
'use client'  // ✅ Mark as client component

import { Card } from '@argus/ui'

export default function Page() {
  return <Card>Content</Card>  // ✅ Works
}
```

### Rule 7: TypeScript Strict Mode

**Standard tsconfig.json settings**:

```json
{
  "compilerOptions": {
    "strict": true,  // Enable all strict checks
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

---

## ✅ Pre-Commit Type Checking

### argus_middleware Validation

```bash
# Run in sequence - fix errors before proceeding
mypy app/ --show-error-codes
ruff check app/
black --check app/
pytest -xvs
```

**Common mypy errors and fixes:**

| Error Code | Meaning | Fix |
|-----------|---------|-----|
| `[var-annotated]` | Missing type annotation on variable | Add `: Type` annotation |
| `[valid-type]` | strawberry.scalars.JSON used as type | Use `dict[str, Any]` instead |
| `[assignment]` | Type mismatch in assignment | Use `Mapped[]` for SQLAlchemy columns |
| `[import-not-found]` | Module doesn't exist | Fix import path or install types |
| `[unreachable]` | Dead code after return | Remove unreachable code |

### fe2 Validation

```bash
# Run in sequence - fix errors before proceeding
npm run type-check
npm run lint
npm run build:packages
npm test
```

**Common TypeScript errors and fixes:**

| Error | Meaning | Fix |
|-------|---------|-----|
| `Cannot find module '@argus/ui/card'` | Sub-path import | Use `@argus/ui` main export |
| `Property 'risk' does not exist` | Graph node property | Use `node.properties?.risk` |
| `Cannot find name 't'` | Missing translation hook | Add `const t = useTranslations()` |
| `Type 'any' is not assignable` | Implicit any | Add explicit type annotation |

---

## 📚 Learning Resources

### Python Type Hints
- [Python typing module docs](https://docs.python.org/3/library/typing.html)
- [SQLAlchemy 2.0 Mapped[] guide](https://docs.sqlalchemy.org/en/20/orm/quickstart.html)
- [mypy documentation](https://mypy.readthedocs.io/)

### TypeScript
- [TypeScript handbook](https://www.typescriptlang.org/docs/)
- [Next.js TypeScript guide](https://nextjs.org/docs/app/building-your-application/configuring/typescript)
- [React TypeScript cheatsheet](https://react-typescript-cheatsheet.netlify.app/)

---

## 🔄 Migration Guides

### Migrating SQLAlchemy Models to Mapped[]

1. Update imports:
```python
from sqlalchemy.orm import Mapped, mapped_column
```

2. Add type annotations to all columns:
```python
# Before
name = Column(String(255))

# After
name: Mapped[str] = mapped_column(String(255))
```

3. Run mypy to verify:
```bash
mypy app/domains/your_domain/
```

### Migrating fe2 from react-i18next to next-intl

Run the migration script:
```bash
cd /mnt/development/fe2/fe2
chmod +x scripts/migrate-to-next-intl.sh
./scripts/migrate-to-next-intl.sh
```

Then manually:
1. Update translation key structure in locale files
2. Remove namespace prefixes from `t()` calls
3. Test all affected pages

---

**Last Updated**: 2025-10-28
**Maintained By**: Development Team
**Status**: ✅ Living Document - Update as patterns evolve
