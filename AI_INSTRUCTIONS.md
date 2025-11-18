# AI Instructions for Documentation Site

**Repository**: argus-docs
**Purpose**: Consolidated documentation site
**Status**: Separate GitHub repository

---

## 🚨 CRITICAL RULES

### 1. NEVER Create Junk Documentation

**BLOCKED Patterns** (DO NOT create files matching these):
- `*SUMMARY*.md`
- `*COMPLETE*.md`
- `*FIXES*.md`
- `*SESSION*.md`
- `*PROMPT*.md`
- `*STATUS*.md`
- `*AUDIT*.md`
- `*VERIFICATION*.md`

**Rule**: If you need to document something, UPDATE an existing file or add to CHANGELOG.md in the source repository.

### 2. Documentation Sources

**Approved Sources** (sync from these only):
```
/mnt/development/README.md → guide/index.md
/mnt/development/AI_MASTER_GUIDE.md → guide/ai-guide.md
/mnt/development/CODING_GUIDELINES.md → guide/coding-guidelines.md
/mnt/development/TYPE_SAFETY_RULES.md → guide/type-safety.md
/mnt/development/I18N_AND_ACCESSIBILITY_REQUIREMENTS.md → guide/accessibility.md
/mnt/development/DATABASE_CONNECTION_GUIDE.md → guide/database.md
/mnt/development/CLOUDFLARE_MANAGEMENT_GUIDE.md → guide/deployment.md
```

**Auto-Generated** (never edit manually):
- `api/graphql/` - Generated from GraphQL schema
- `api/rest/` - Generated from OpenAPI spec
- `components/` - Generated from TypeDoc

### 3. Update Workflow

**When source docs change**:
1. Run: `node scripts/sync-docs.js`
2. Run: `node scripts/validate-docs.js`
3. Commit if validation passes
4. Push to trigger deployment

**When API changes**:
1. Regenerate: `npm run generate:api`
2. Commit generated files
3. Push

**When components change**:
1. Regenerate: `npm run generate:components`
2. Commit generated files
3. Push

---

## 📝 Content Guidelines

### File Naming
- Use kebab-case: `coding-guidelines.md`
- Be descriptive: `graphql-api-reference.md`
- Avoid dates: ❌ `guide-2025-01-18.md`
- Avoid status: ❌ `feature-complete.md`

### Frontmatter (Required)
```yaml
---
title: Page Title
description: Brief description for SEO
---
```

### Accessibility (WCAG 2.2 AAA)
- All images need alt text
- All links need descriptive text
- Headings follow hierarchy (h1 → h2 → h3)
- Code blocks have language labels
- No color-only information

### Content Structure
```markdown
# Page Title (h1 - only one per page)

Brief introduction paragraph.

## Section (h2)

Content here.

### Subsection (h3)

More specific content.

## Code Examples

\`\`\`typescript
// Always include language label
const example = "code";
\`\`\`
```

---

## 🤖 Automation Scripts

### Sync Documentation
```bash
npm run sync
# Runs: node scripts/sync-docs.js
# Syncs approved files from source repos
# Blocks junk patterns automatically
```

### Validate Documentation
```bash
npm run validate
# Runs: node scripts/validate-docs.js
# Checks for junk docs
# Validates frontmatter
# Checks accessibility
```

### Generate API Docs
```bash
npm run generate:api
# Generates GraphQL docs from schema
# Generates REST docs from OpenAPI
```

### Generate Component Docs
```bash
npm run generate:components
# Runs TypeDoc on fe2 components
# Outputs to components/ directory
```

---

## 🔄 Maintenance Schedule

**Weekly** (Automated via GitHub Actions):
- Sync core guides from source repos
- Regenerate API documentation
- Regenerate component documentation
- Validate all docs
- Create PR if changes detected

**Monthly** (Manual):
- Review and update examples
- Check for broken links
- Update screenshots
- Verify branding compliance

**Quarterly** (Manual):
- Accessibility audit (Lighthouse)
- Branding review (branding.knogin.com)
- Content freshness review
- Dependency updates

---

## ✅ Pre-Commit Checklist

Before committing documentation changes:

- [ ] No junk doc patterns in filename
- [ ] Frontmatter includes title and description
- [ ] All images have alt text
- [ ] All links are descriptive
- [ ] Code blocks have language labels
- [ ] Headings follow hierarchy
- [ ] Ran `npm run validate`
- [ ] Tested locally with `npm run dev`

---

## 🚫 What NOT to Do

**DON'T**:
- ❌ Create summary files
- ❌ Create completion reports
- ❌ Create fix documentation
- ❌ Create session logs
- ❌ Create status updates
- ❌ Duplicate existing content
- ❌ Edit auto-generated files manually

**DO**:
- ✅ Update existing files
- ✅ Add to CHANGELOG in source repo
- ✅ Create new guides in guide/
- ✅ Follow naming conventions
- ✅ Validate before committing

---

## 📊 Quality Metrics

**Target Standards**:
- Lighthouse Accessibility: 100
- Lighthouse SEO: 100
- Zero broken links
- Zero junk docs
- 100% frontmatter compliance

**Check with**:
```bash
npm run validate
npm run build
npm run preview
# Then run Lighthouse audit
```

---

## 🆘 Troubleshooting

**Validation fails**:
1. Check error message
2. Fix the issue
3. Run `npm run validate` again

**Sync fails**:
1. Check source file exists
2. Check file isn't blocked pattern
3. Check file permissions

**Build fails**:
1. Check for broken links
2. Check frontmatter syntax
3. Check markdown syntax

---

**Last Updated**: 2025-01-18
**Maintained By**: Argus Platform Team
