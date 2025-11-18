#!/bin/bash
# GitHub Repository Setup Script
# Run this to create and push argus-docs to GitHub

set -e

echo "🚀 Setting up argus-docs GitHub repository..."

# Initialize git
cd /mnt/development/argus-docs
git init
git add .
git commit -m "Initial commit: VitePress documentation site with automation

- Knogin branding and WCAG 2.2 AAA accessibility
- Automated sync from source repos
- Junk doc prevention
- Auto-generated API and component docs"

# Create GitHub repo (requires gh CLI)
echo "📦 Creating GitHub repository..."
gh repo create knogineer/argus-docs \
  --public \
  --description "Argus Platform Documentation - Consolidated docs with automation" \
  --homepage "https://docs.knogin.com"

# Add remote and push
git branch -M main
git remote add origin https://github.com/knogineer/argus-docs.git
git push -u origin main

echo "✅ Repository created and pushed!"
echo "🔗 https://github.com/knogineer/argus-docs"
echo ""
echo "Next steps:"
echo "1. Enable GitHub Pages in repository settings"
echo "2. Set up Cloudflare Pages deployment"
echo "3. Run 'npm run sync' to populate content"
