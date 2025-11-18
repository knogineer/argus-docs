# Documentation Migration Plan

**From**: Scattered markdown files (517 total)
**To**: Consolidated VitePress site
**Target**: 300 files (40% reduction)

---

## Migration Phases

### Phase 1: Core Guides (2-3 hours)

**Priority**: High
**Files**: 15 essential guides

**Source → Destination**:
```
/mnt/development/README.md → guide/index.md
/mnt/development/AI_MASTER_GUIDE.md → guide/ai-guide.md
/mnt/development/CODING_GUIDELINES.md → guide/coding-guidelines.md
/mnt/development/TYPE_SAFETY_RULES.md → guide/type-safety.md
/mnt/development/I18N_AND_ACCESSIBILITY_REQUIREMENTS.md → guide/accessibility.md
/mnt/development/DATABASE_CONNECTION_GUIDE.md → guide/database.md
/mnt/development/CLOUDFLARE_MANAGEMENT_GUIDE.md → guide/deployment.md
/mnt/development/GITHUB_ROADMAP_WORKFLOW_GUIDE.md → guide/workflow.md
```

**Actions**:
1. Copy files to argus-docs/guide/
2. Update internal links
3. Add frontmatter metadata
4. Test navigation

### Phase 2: API Documentation (3-4 hours)

**Priority**: High
**Files**: Auto-generate from schemas

**GraphQL Documentation**:
```bash
# Generate from schema
cd /mnt/development/argus_middleware/argus_middleware
npx graphql-markdown --schema schema.graphql --output ../../argus-docs/api/graphql/
```

**REST API Documentation**:
```bash
# Generate from FastAPI OpenAPI
cd /mnt/development/argus_middleware/argus_middleware
python -c "from app.main import app; import json; print(json.dumps(app.openapi()))" > ../../argus-docs/api/openapi.json
```

**Actions**:
1. Set up GraphQL Code Generator
2. Generate GraphQL docs
3. Generate REST API docs from OpenAPI
4. Create integration guides
5. Archive old API docs

**Files Reduced**: 40 → 10 (75% reduction)

### Phase 3: Component Documentation (4-6 hours)

**Priority**: Medium
**Files**: Auto-generate from TypeScript

**TypeDoc Setup**:
```bash
cd /mnt/development/fe2/fe2
npm install --save-dev typedoc typedoc-plugin-markdown
npx typedoc --out ../../argus-docs/components --plugin typedoc-plugin-markdown
```

**Source**: fe2/fe2/docs/argus/ (173 files)
**Target**: argus-docs/components/ (50 files)

**Actions**:
1. Configure TypeDoc
2. Extract JSDoc from components
3. Generate component API docs
4. Create component showcase
5. Archive old markdown files

**Files Reduced**: 173 → 50 (70% reduction)

### Phase 4: Feature Documentation (2-3 hours)

**Priority**: Low
**Files**: 50 feature docs

**Source → Destination**:
```
/mnt/development/docs/features/ → guide/features/
/mnt/development/docs/modules/ → guide/modules/
```

**Actions**:
1. Copy feature documentation
2. Organize by audience (user vs developer)
3. Update links
4. Archive duplicates

**Files Reduced**: 50 → 35 (30% reduction)

---

## Automation Scripts

### 1. Link Updater

```bash
#!/bin/bash
# update-links.sh
# Updates internal links to new structure

find argus-docs -name "*.md" -type f -exec sed -i \
  -e 's|/mnt/development/README.md|/guide/|g' \
  -e 's|/mnt/development/AI_MASTER_GUIDE.md|/guide/ai-guide|g' \
  -e 's|/mnt/development/CODING_GUIDELINES.md|/guide/coding-guidelines|g' \
  {} +
```

### 2. Frontmatter Generator

```bash
#!/bin/bash
# add-frontmatter.sh
# Adds VitePress frontmatter to markdown files

for file in argus-docs/guide/*.md; do
  title=$(basename "$file" .md | tr '-' ' ' | sed 's/\b\(.\)/\u\1/g')
  echo "---
title: $title
description: Auto-generated description
---
$(cat "$file")" > "$file"
done
```

### 3. Archive Old Files

```bash
#!/bin/bash
# archive-old-docs.sh
# Moves old docs to archive

mkdir -p /mnt/development/.docs-archive
mv /mnt/development/fe2/fe2/docs/argus/*.md /mnt/development/.docs-archive/
```

---

## Quality Checklist

### Accessibility (WCAG 2.2 AAA)
- [ ] All images have alt text
- [ ] All links have descriptive text
- [ ] Headings follow proper hierarchy
- [ ] Code blocks have language labels
- [ ] Tables have proper headers
- [ ] Forms have labels
- [ ] Focus indicators visible
- [ ] Touch targets 44x44px minimum

### Content Quality
- [ ] No broken links
- [ ] No duplicate content
- [ ] Consistent terminology
- [ ] Code examples tested
- [ ] Screenshots up-to-date
- [ ] Version numbers current

### SEO & Metadata
- [ ] All pages have titles
- [ ] All pages have descriptions
- [ ] Proper heading structure
- [ ] Sitemap generated
- [ ] robots.txt configured

---

## Timeline

**Week 1**: Phase 1 & 2 (Core guides + API docs)
**Week 2**: Phase 3 (Component docs)
**Week 3**: Phase 4 (Feature docs) + Testing
**Week 4**: Review, polish, deploy

**Total Estimated Time**: 12-18 hours

---

## Success Metrics

- ✅ File count: 517 → 300 (40% reduction)
- ✅ Zero broken links
- ✅ 100% accessibility score (Lighthouse)
- ✅ All API docs auto-generated
- ✅ Search functionality working
- ✅ Mobile responsive
- ✅ Dark mode functional
- ✅ Branding compliance verified

---

**Status**: Ready to begin migration
**Next Action**: Execute Phase 1 (Core Guides)
