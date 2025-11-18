import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Argus Platform',
  description: 'Intelligence Platform Documentation',
  
  // Knogin branding
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { name: 'theme-color', content: '#0066CC' }], // Knogin primary blue
  ],

  themeConfig: {
    // Knogin branding colors (from branding.knogin.com)
    logo: '/logo.svg',
    
    // Navigation
    nav: [
      { text: 'Guide', link: '/guide/' },
      { text: 'API Reference', link: '/api/' },
      { text: 'Components', link: '/components/' },
      { text: 'GitHub', link: 'https://github.com/knogineer/argus-docs' }
    ],

    // Sidebar navigation
    sidebar: {
      '/guide/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Introduction', link: '/guide/' },
            { text: 'Quick Start', link: '/guide/quick-start' },
            { text: 'Installation', link: '/guide/installation' }
          ]
        },
        {
          text: 'Development',
          items: [
            { text: 'Architecture', link: '/guide/architecture' },
            { text: 'Database', link: '/guide/database' },
            { text: 'Deployment', link: '/guide/deployment' }
          ]
        },
        {
          text: 'Standards',
          items: [
            { text: 'Coding Guidelines', link: '/guide/coding-guidelines' },
            { text: 'Type Safety', link: '/guide/type-safety' },
            { text: 'Accessibility', link: '/guide/accessibility' },
            { text: 'i18n', link: '/guide/i18n' }
          ]
        }
      ],
      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: 'Overview', link: '/api/' },
            { text: 'GraphQL', link: '/api/graphql' },
            { text: 'REST', link: '/api/rest' },
            { text: 'Authentication', link: '/api/auth' }
          ]
        }
      ],
      '/components/': [
        {
          text: 'Components',
          items: [
            { text: 'Overview', link: '/components/' },
            { text: 'Map & Geospatial', link: '/components/map' },
            { text: 'Alerts', link: '/components/alerts' },
            { text: 'Case Management', link: '/components/case-management' }
          ]
        }
      ]
    },

    // Social links
    socialLinks: [
      { icon: 'github', link: 'https://github.com/knogineer' }
    ],

    // Footer
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2025 Knogin'
    },

    // Search
    search: {
      provider: 'local'
    }
  },

  // WCAG 2.2 AAA Accessibility
  markdown: {
    attrs: {
      disable: false
    }
  }
})
