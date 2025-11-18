# Argus Platform Documentation

**Version**: 1.0.0
**Status**: 🔄 In Development

---

## Overview

This is the official documentation site for the Argus Intelligence Platform. Built with VitePress, it consolidates all platform documentation into a single, searchable, accessible resource.

## Features

- ✅ **Knogin Branding**: Follows [branding.knogin.com](https://branding.knogin.com) guidelines
- ✅ **WCAG 2.2 AAA**: Full accessibility compliance
- ✅ **i18n Ready**: Multi-language support (EN/ES/FR)
- ✅ **Auto-generated**: Component and API docs generated from code
- ✅ **Fast Search**: Built-in local search
- ✅ **Dark Mode**: Accessible dark theme

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Structure

```
argus-docs/
├── .vitepress/
│   ├── config.ts          # VitePress configuration
│   └── theme/
│       ├── index.ts       # Theme customization
│       └── custom.css     # Knogin branding + WCAG AAA styles
├── guide/                 # Developer guides
├── api/                   # API reference
├── components/            # Component documentation
├── public/                # Static assets
└── index.md               # Homepage
```

## Accessibility

This documentation site is WCAG 2.2 AAA compliant:

- ✅ **Contrast**: 7:1 minimum contrast ratio
- ✅ **Focus indicators**: 3px visible focus rings
- ✅ **Touch targets**: Minimum 44x44px
- ✅ **Keyboard navigation**: Full keyboard support
- ✅ **Screen readers**: Semantic HTML and ARIA labels
- ✅ **Reduced motion**: Respects prefers-reduced-motion
- ✅ **High contrast**: Supports high contrast mode

## Branding

Colors from [branding.knogin.com](https://branding.knogin.com):

- **Primary**: #0066CC (Knogin Blue)
- **Secondary**: #0052A3
- **Accent**: #003D7A

## Deployment

This site will be deployed to:
- **Production**: https://docs.knogin.com
- **Staging**: https://docs-staging.knogin.com

Deploy via GitHub Actions on push to `main` branch.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Ensure accessibility compliance
5. Submit a pull request

## License

MIT License - Copyright © 2025 Knogin

---

**Maintained by**: Argus Platform Team
**Last Updated**: 2025-01-18
