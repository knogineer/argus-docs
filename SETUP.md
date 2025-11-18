# Argus Docs Setup Guide

## Initial Setup

```bash
cd /mnt/development/argus-docs
npm install
npm run dev
```

Visit http://localhost:5173

## Git Repository Setup

```bash
cd /mnt/development/argus-docs
git init
git add .
git commit -m "Initial commit: VitePress documentation site"
git remote add origin https://github.com/knogineer/argus-docs.git
git push -u origin main
```

## Content Migration Plan

### Phase 1: Core Guides (Priority 1)
Copy from `/mnt/development`:
- README.md → guide/index.md
- AI_MASTER_GUIDE.md → guide/ai-guide.md
- CODING_GUIDELINES.md → guide/coding-guidelines.md
- TYPE_SAFETY_RULES.md → guide/type-safety.md
- I18N_AND_ACCESSIBILITY_REQUIREMENTS.md → guide/accessibility.md

### Phase 2: API Documentation (Priority 2)
Auto-generate from:
- GraphQL schema → api/graphql.md
- FastAPI OpenAPI → api/rest.md
- argus_middleware API docs → api/

### Phase 3: Component Documentation (Priority 3)
Auto-generate from:
- fe2/docs/argus/ → components/
- TypeDoc output → components/

### Phase 4: Feature Documentation (Priority 4)
Copy from `/mnt/development/docs/features/`:
- COURT_FILINGS.md → guide/features/court-filings.md
- DISCLOSURE_PACKS.md → guide/features/disclosure-packs.md
- TENANT_OPERATIONS_LOG_FEATURE.md → guide/features/operations-log.md

## Accessibility Checklist

- [x] WCAG 2.2 AAA contrast ratios (7:1)
- [x] Focus indicators (3px visible)
- [x] Touch targets (44x44px minimum)
- [x] Keyboard navigation
- [x] Screen reader support
- [x] Reduced motion support
- [x] High contrast mode support
- [ ] Test with NVDA/JAWS
- [ ] Test with VoiceOver
- [ ] Lighthouse accessibility audit (100 score)

## Branding Compliance

- [x] Knogin primary blue (#0066CC)
- [x] Knogin typography
- [x] Logo placement
- [ ] Verify against branding.knogin.com
- [ ] Brand review approval

## Deployment

### GitHub Actions (Recommended)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy Documentation

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
      - run: npm ci
      - run: npm run build
      - uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: argus-docs
          directory: .vitepress/dist
```

### Manual Deployment

```bash
npm run build
npx wrangler pages deploy .vitepress/dist --project-name=argus-docs
```

## Maintenance

- Update dependencies monthly: `npm update`
- Review accessibility quarterly
- Sync with branding.knogin.com changes
- Regenerate API docs on schema changes
