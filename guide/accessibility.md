---
title: Internationalization (i18n) and Accessibility Requirements
description: Mandatory WCAG 2.2 AAA accessibility and multilingual standards for all Argus features.
---

# Internationalization (i18n) and Accessibility Requirements

**Version**: 1.0
**Last Updated**: 2025-11-10
**Status**: ✅ Mandatory Requirements for All Development

---

## 🚨 CRITICAL: Mandatory Compliance

**Both i18n and accessibility are REQUIRED before code can be merged.**

- **i18n**: 100% translation coverage for all user-facing strings
- **Accessibility**: WCAG 2.2 AAA compliance for all interactive elements

These are not "nice to have" features - they are **critical functional requirements** that:
- Enable global usage across English, Spanish, and French-speaking users
- Ensure people with disabilities can use our law enforcement intelligence platform
- Meet legal requirements (ADA, Section 508, AODA, EU Web Accessibility Directive)
- Fulfill our mission to build inclusive intelligence tools

---

## Part 1: Internationalization (i18n)

### Overview

The Argus platform uses **react-i18next** with an auto-generated translation system:
- Developers add English translations to feature-specific JSON files
- Build system automatically consolidates into master translation files
- Translation team manages Spanish (ES) and French (FR) translations

### Translation File Structure

```
apps/web/messages/
├── en/                          # ✅ ADD ENGLISH KEYS HERE
│   ├── cloudflare.json          # Feature-specific translations
│   ├── admin.json
│   ├── actions.json
│   ├── common.json
│   └── [feature].json
├── en.json                      # ❌ AUTO-GENERATED - DO NOT EDIT
├── es.json                      # ❌ MANAGED BY TRANSLATION TEAM
└── fr.json                      # ❌ MANAGED BY TRANSLATION TEAM
```

**Location**: `/mnt/development/fe2/fe2/apps/web/messages/`

### Developer Workflow

#### Step 1: Create Feature Translation File

Create a new JSON file in `/en/` subdirectory with your feature name.

**Example**: `/mnt/development/fe2/fe2/apps/web/messages/en/cloudflare.json`

```json
{
  "settings": {
    "title": "Cloudflare Workers AI Settings",
    "description": "Configure Cloudflare Workers AI for cost-optimized LLM operations",
    "accountId": "Account ID",
    "accountIdPlaceholder": "Enter your Cloudflare account ID",
    "accountIdDescription": "Your Cloudflare account identifier",
    "apiToken": "API Token",
    "apiTokenPlaceholder": "Enter your API token",
    "apiTokenDescription": "Generate from Cloudflare dashboard → API Tokens",
    "defaultModel": "Default Model",
    "saveButton": "Save Settings",
    "testConnection": "Test Connection"
  },
  "models": {
    "llama4Scout": "Llama 4 Scout (17B, Multimodal)",
    "llama33Fast": "Llama 3.3 70B Fast (Speed Optimized)",
    "llama31": "Llama 3.1 8B (Cost Optimized)"
  },
  "usage": {
    "title": "LLM Usage Statistics",
    "publicLLMs": "Public LLMs (Cloudflare)",
    "privateLLMs": "Private LLMs (Premium Providers)",
    "totalTokens": "Total Tokens Used",
    "totalCost": "Total Cost (USD)",
    "costSavings": "{{percent}}% cost savings",
    "monthlyUsage": "Monthly Usage"
  },
  "messages": {
    "saveSuccess": "Settings saved successfully",
    "saveError": "Failed to save settings: {{error}}",
    "testSuccess": "Connection successful",
    "testError": "Connection failed: {{error}}",
    "invalidAccountId": "Invalid account ID format",
    "invalidToken": "Invalid API token format"
  },
  "validation": {
    "accountIdRequired": "Account ID is required",
    "apiTokenRequired": "API token is required",
    "modelRequired": "Default model must be selected"
  },
  "ariaLabels": {
    "accountIdInput": "Cloudflare account identifier input field",
    "apiTokenInput": "Cloudflare API token input field",
    "modelSelect": "Select default AI model",
    "saveButton": "Save Cloudflare settings",
    "testButton": "Test Cloudflare connection"
  }
}
```

#### Step 2: Use Translation Keys in React Components

**ALWAYS use `useTranslation()` hook** - never hardcode English strings.

```typescript
"use client"

import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function CloudflareSettings() {
  const { t } = useTranslation()
  const [accountId, setAccountId] = useState('')
  const [error, setError] = useState('')

  return (
    <div>
      <h2>{t('cloudflare.settings.title')}</h2>
      <p>{t('cloudflare.settings.description')}</p>

      {/* Form field with accessibility and i18n */}
      <div>
        <Label htmlFor="account-id">
          {t('cloudflare.settings.accountId')}
        </Label>
        <Input
          id="account-id"
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          placeholder={t('cloudflare.settings.accountIdPlaceholder')}
          aria-label={t('cloudflare.ariaLabels.accountIdInput')}
          aria-describedby="account-id-desc"
          aria-invalid={!!error}
        />
        <p id="account-id-desc" className="text-sm text-muted">
          {t('cloudflare.settings.accountIdDescription')}
        </p>
        {error && (
          <p role="alert" className="text-sm text-red-600">
            {t('cloudflare.validation.accountIdRequired')}
          </p>
        )}
      </div>

      {/* Button with i18n and accessibility */}
      <Button
        onClick={handleSave}
        aria-label={t('cloudflare.ariaLabels.saveButton')}
      >
        {t('cloudflare.settings.saveButton')}
      </Button>

      {/* Success/Error messages with interpolation */}
      {saved && (
        <div role="status" className="text-green-600">
          {t('cloudflare.messages.saveSuccess')}
        </div>
      )}
      {connectionError && (
        <div role="alert" className="text-red-600">
          {t('cloudflare.messages.testError', { error: connectionError })}
        </div>
      )}
    </div>
  )
}
```

### Key Naming Conventions

**Pattern**: `feature.category.element`

- **Feature**: Your feature name (e.g., `cloudflare`)
- **Category**: Logical grouping (e.g., `settings`, `usage`, `messages`)
- **Element**: Specific UI element (e.g., `accountId`, `saveButton`)

**Examples**:
```typescript
t('cloudflare.settings.title')              // Page title
t('cloudflare.settings.accountId')          // Form label
t('cloudflare.settings.accountIdPlaceholder') // Input placeholder
t('cloudflare.messages.saveSuccess')        // Success notification
t('cloudflare.ariaLabels.saveButton')       // Accessibility label
```

### Interpolation for Dynamic Values

Use `{{variable}}` syntax for dynamic content:

```json
{
  "usage": {
    "costSavings": "Saved ${{amount}} ({{percent}}% reduction)",
    "modelSelected": "Using {{modelName}} for {{taskType}}",
    "rateLimit": "Rate limit: {{current}}/{{max}} requests"
  }
}
```

```typescript
t('cloudflare.usage.costSavings', { amount: 125.43, percent: 89 })
// Output: "Saved $125.43 (89% reduction)"

t('cloudflare.usage.modelSelected', {
  modelName: 'Llama 3.1 8B',
  taskType: 'entity extraction'
})
// Output: "Using Llama 3.1 8B for entity extraction"
```

### Reusing Existing Translation Keys

**ALWAYS check existing translation files first** to avoid duplication.

```typescript
// Common actions (already exist in /en/actions.json)
t('actions.save')     // "Save"
t('actions.cancel')   // "Cancel"
t('actions.delete')   // "Delete"
t('actions.create')   // "Create"
t('actions.update')   // "Update"
t('actions.close')    // "Close"
t('actions.refresh')  // "Refresh"

// Common labels (already exist in /en/common.json)
t('common.loading')   // "Loading..."
t('common.error')     // "Error"
t('common.success')   // "Success"

// Status labels (already exist in /en/admin.json)
t('admin.status.active')    // "Active"
t('admin.status.inactive')  // "Inactive"
t('admin.status.pending')   // "Pending"
```

### Validation (Automatic)

Pre-commit hooks automatically check:
- ✅ All English keys are properly formatted JSON
- ✅ No hardcoded strings in components
- ✅ Translation coverage (Spanish/French handled by translation team)

**Run validation manually**:
```bash
cd /mnt/development/fe2/fe2/apps/web
node scripts/check-translations.js
```

### Common Mistakes to Avoid

❌ **WRONG - Hardcoded English**:
```typescript
<Button>Save Settings</Button>
<Label>Account ID</Label>
<p>Connection failed</p>
```

❌ **WRONG - Editing auto-generated files**:
```typescript
// DO NOT edit en.json, es.json, or fr.json directly
// These are auto-generated and your changes will be overwritten
```

❌ **WRONG - Missing aria-label translations**:
```typescript
<button aria-label="Save settings">  // Hardcoded English
  {t('cloudflare.settings.saveButton')}
</button>
```

✅ **CORRECT - Full i18n compliance**:
```typescript
<Button aria-label={t('cloudflare.ariaLabels.saveButton')}>
  {t('cloudflare.settings.saveButton')}
</Button>
```

### Translation Checklist

Before submitting code, ensure:

- [ ] Created feature-specific JSON file in `/en/` subdirectory
- [ ] All user-facing strings use `t('key.path')` syntax
- [ ] All `aria-label`, `aria-describedby`, and ARIA attributes use translation keys
- [ ] All placeholders use translation keys
- [ ] All error/success messages use translation keys
- [ ] No hardcoded English strings in JSX/TSX
- [ ] Checked existing translations for reusable keys
- [ ] Used interpolation for dynamic values
- [ ] Validation script passes: `node scripts/check-translations.js`

---

## Part 2: Accessibility (WCAG 2.2 AAA)

### Overview

**Compliance Level**: WCAG 2.2 Level AAA (exceeds legal minimum of AA)

All interactive elements, forms, media, and navigation must be fully accessible to users with:
- Visual impairments (blind, low vision, color blindness)
- Motor impairments (cannot use mouse, keyboard-only navigation)
- Auditory impairments (deaf, hard of hearing)
- Cognitive impairments (dyslexia, attention disorders)

### Core Accessibility Features

#### 1. Font Accessibility
- **OpenDyslexic Toggle**: Available in header accessibility controls
- **Font Scaling**: Small/Medium/Large/Extra-Large options (4 levels)
- **Implementation**: CSS classes and data attributes, NOT inline styles

#### 2. Theme Accessibility
- **High Contrast Mode**: Pure black/white theme for enhanced visibility
- **Dark/Light Themes**: Respects system preferences
- **Color Contrast**: All combinations meet WCAG 2.2 AAA standards (7:1 for normal text, 4.5:1 for large text)

#### 3. Keyboard Navigation
- **Focus Management**: Visible focus indicators on ALL interactive elements
- **Tab Order**: Logical navigation flow matching visual layout
- **Skip Links**: Direct navigation to main content
- **Keyboard Shortcuts**: Documented and non-conflicting with assistive tech

### ESLint Rules (Enforced)

Our codebase enforces these `jsx-a11y` rules:
- `click-events-have-key-events` - Interactive elements must support keyboard
- `no-static-element-interactions` - Use semantic HTML or proper ARIA
- `media-has-caption` - All video/audio must have captions
- `interactive-supports-focus` - Interactive elements must be focusable
- `no-noninteractive-element-interactions` - Don't make non-interactive elements interactive
- `no-autofocus` - Don't automatically focus elements (except modals with justification)

### Validation Commands

```bash
# Check all accessibility issues
cd /mnt/development/fe2/fe2/apps/web
npm run lint | grep "jsx-a11y"

# Run accessibility tests
npm run test:a11y

# Generate accessibility report
npm run test:a11y:report
```

### Common Patterns & Solutions

#### Pattern 1: Interactive Elements (Click Handlers)

❌ **WRONG - Not Keyboard Accessible**:
```typescript
<div onClick={() => handleSelect(item)}>
  Click me
</div>
```

**Problems**:
- Keyboard users cannot activate this element
- Screen readers don't announce it as interactive
- Cannot receive focus via Tab key

✅ **CORRECT - Full Keyboard Support**:
```typescript
<div
  onClick={() => handleSelect(item)}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSelect(item);
    }
  }}
  role="button"
  tabIndex={0}
  aria-label={t('cloudflare.ariaLabels.selectItem')}
>
  {t('cloudflare.actions.clickMe')}
</div>
```

**What this provides**:
- ✅ Works with Enter and Space keys (standard button behavior)
- ✅ Focusable via Tab key (`tabIndex={0}`)
- ✅ Announced as button by screen readers (`role="button"`)
- ✅ Clear description for screen reader users (`aria-label`)
- ✅ Fully translated for i18n

✅ **BEST - Use Semantic HTML**:
```typescript
<button
  onClick={() => handleSelect(item)}
  aria-label={t('cloudflare.ariaLabels.selectItem')}
>
  {t('cloudflare.actions.clickMe')}
</button>
```

#### Pattern 2: Form Fields

❌ **WRONG - Missing Labels and ARIA**:
```typescript
<input
  type="text"
  placeholder="Enter account ID"
  onChange={(e) => setAccountId(e.target.value)}
/>
```

✅ **CORRECT - Full Accessibility**:
```typescript
<div>
  <Label htmlFor="account-id">
    {t('cloudflare.settings.accountId')}
  </Label>
  <Input
    id="account-id"
    type="text"
    value={accountId}
    onChange={(e) => setAccountId(e.target.value)}
    placeholder={t('cloudflare.settings.accountIdPlaceholder')}
    aria-label={t('cloudflare.ariaLabels.accountIdInput')}
    aria-describedby="account-id-desc account-id-error"
    aria-invalid={!!error}
    aria-required={true}
  />
  <p id="account-id-desc" className="text-sm text-muted">
    {t('cloudflare.settings.accountIdDescription')}
  </p>
  {error && (
    <p id="account-id-error" role="alert" className="text-sm text-red-600">
      {t('cloudflare.validation.accountIdRequired')}
    </p>
  )}
</div>
```

**What this provides**:
- ✅ Label associated with input (`htmlFor` + `id`)
- ✅ Description announced to screen readers (`aria-describedby`)
- ✅ Error state announced (`aria-invalid`, `role="alert"`)
- ✅ Required field indicated (`aria-required`)
- ✅ Fully translated

#### Pattern 3: Custom Interactive Components

Use our accessibility utility functions from `lib/accessibility.ts`:

```typescript
import { createAccessibleClickHandler } from '@/lib/accessibility'

export function CloudflareCard({ item, onSelect }) {
  const { t } = useTranslation()

  const handleClick = createAccessibleClickHandler(() => {
    onSelect(item)
  })

  return (
    <div
      {...handleClick}
      role="button"
      tabIndex={0}
      aria-label={t('cloudflare.ariaLabels.selectCard', { name: item.name })}
      className="cursor-pointer focus:ring-2 focus:ring-blue-500"
    >
      {item.name}
    </div>
  )
}
```

**`createAccessibleClickHandler` provides**:
- ✅ `onClick` handler
- ✅ `onKeyDown` handler (Enter and Space keys)
- ✅ Proper event prevention
- ✅ Consistent keyboard behavior

#### Pattern 4: Loading States

❌ **WRONG - No Screen Reader Announcement**:
```typescript
{loading && <div>Loading...</div>}
```

✅ **CORRECT - Announced to Screen Readers**:
```typescript
{loading && (
  <div role="status" aria-live="polite">
    {t('common.loading')}
  </div>
)}
```

#### Pattern 5: Error Messages

❌ **WRONG - Not Announced**:
```typescript
{error && <div className="text-red-600">{error}</div>}
```

✅ **CORRECT - Alert Role**:
```typescript
{error && (
  <div role="alert" className="text-red-600">
    {t('cloudflare.messages.error', { error })}
  </div>
)}
```

#### Pattern 6: Modal Dialogs

✅ **CORRECT - Full Accessibility**:
```typescript
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'

export function CloudflareModal({ open, onClose }) {
  const { t } = useTranslation()

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        aria-labelledby="dialog-title"
        aria-describedby="dialog-description"
      >
        <DialogTitle id="dialog-title">
          {t('cloudflare.modal.title')}
        </DialogTitle>
        <p id="dialog-description">
          {t('cloudflare.modal.description')}
        </p>

        <button
          onClick={onClose}
          aria-label={t('common.ariaLabels.closeDialog')}
        >
          {t('actions.close')}
        </button>
      </DialogContent>
    </Dialog>
  )
}
```

**What this provides**:
- ✅ Focus trap (cannot Tab outside dialog)
- ✅ Escape key closes dialog
- ✅ Focus restored to trigger element on close
- ✅ Proper ARIA labels and descriptions
- ✅ Fully translated

### ARIA Attributes Guide

**Required ARIA attributes for common elements**:

| Element Type | Required ARIA |
|--------------|---------------|
| Custom button | `role="button"`, `tabIndex={0}`, `aria-label` |
| Form field | `aria-label` or associated `<label>`, `aria-required`, `aria-invalid` |
| Error message | `role="alert"`, `aria-live="assertive"` |
| Success message | `role="status"`, `aria-live="polite"` |
| Loading indicator | `role="status"`, `aria-live="polite"` |
| Modal dialog | `role="dialog"`, `aria-labelledby`, `aria-describedby` |
| Tabs | `role="tablist"`, `role="tab"`, `role="tabpanel"`, `aria-selected` |
| Accordion | `aria-expanded`, `aria-controls` |

### Color Contrast Requirements (WCAG 2.2 AAA)

**Minimum contrast ratios**:
- Normal text (< 18pt): **7:1**
- Large text (≥ 18pt or ≥ 14pt bold): **4.5:1**
- UI components and graphics: **3:1**

**Test contrast**:
- Use browser DevTools contrast checker
- Online tool: https://webaim.org/resources/contrastchecker/

**Our theme colors meet AAA standards**:
```css
/* Light theme */
--foreground: hsl(222.2 84% 4.9%)    /* Text: 7:1 on white background */
--primary: hsl(221.2 83.2% 53.3%)    /* Interactive: 4.5:1 on white */

/* Dark theme */
--foreground: hsl(210 40% 98%)       /* Text: 7:1 on dark background */
--primary: hsl(217.2 91.2% 59.8%)    /* Interactive: 4.5:1 on dark */

/* High contrast mode */
--foreground: hsl(0 0% 100%)         /* Pure white text */
--background: hsl(0 0% 0%)           /* Pure black background */
```

### Focus Indicators

**All interactive elements MUST have visible focus indicators**:

```css
/* Default focus ring (applies globally) */
*:focus-visible {
  outline: 2px solid hsl(var(--ring));
  outline-offset: 2px;
}

/* Custom focus for specific components */
.custom-button:focus-visible {
  ring: 2px;
  ring-color: hsl(var(--primary));
  ring-offset: 2px;
}
```

### Accessibility Checklist

Before submitting code, ensure:

#### Interactive Elements
- [ ] All clickable elements support keyboard (Enter/Space)
- [ ] All interactive elements have `tabIndex={0}` or are semantic HTML
- [ ] All custom interactive elements have `role` attribute
- [ ] All interactive elements have `aria-label` or visible label
- [ ] Focus indicators visible on all interactive elements

#### Forms
- [ ] All inputs have associated labels (`htmlFor` + `id`)
- [ ] All required fields marked with `aria-required`
- [ ] Error states use `aria-invalid` and `role="alert"`
- [ ] Form validation messages are announced to screen readers
- [ ] Placeholders are translated and not relied upon as labels

#### ARIA Attributes
- [ ] `aria-label` on all custom interactive elements
- [ ] `aria-describedby` for additional descriptions
- [ ] `aria-live` for dynamic content updates
- [ ] `role` attributes match semantic meaning
- [ ] ARIA attributes are translated (use `t()` function)

#### Color & Contrast
- [ ] Text meets 7:1 contrast ratio (WCAG AAA)
- [ ] Interactive elements meet 4.5:1 contrast ratio
- [ ] Information not conveyed by color alone
- [ ] High contrast mode supported

#### Keyboard Navigation
- [ ] Tab order is logical (matches visual layout)
- [ ] All features accessible via keyboard alone
- [ ] Focus trap implemented in modals
- [ ] Escape key closes modals/dropdowns
- [ ] No keyboard traps (can always Tab away)

#### Screen Readers
- [ ] All images have alt text (or `alt=""` for decorative)
- [ ] All icons have `aria-label` if not decorative
- [ ] Headings in logical order (h1, h2, h3)
- [ ] Landmark regions used (`<header>`, `<main>`, `<nav>`, `<footer>`)
- [ ] Loading states announced (`role="status"`)
- [ ] Error messages announced (`role="alert"`)

#### Media
- [ ] All videos have captions
- [ ] All audio content has transcripts
- [ ] Media controls are keyboard accessible
- [ ] Autoplay disabled (or user can stop)

#### Validation
- [ ] ESLint accessibility checks pass: `npm run lint | grep "jsx-a11y"`
- [ ] Accessibility tests pass: `npm run test:a11y`
- [ ] Manual keyboard testing completed
- [ ] Screen reader testing completed (NVDA/JAWS/VoiceOver)

---

## Part 3: Combined i18n + Accessibility Example

**Complete example showing both requirements**:

```typescript
"use client"

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'

export function CloudflareSettingsForm() {
  const { t } = useTranslation()
  const [accountId, setAccountId] = useState('')
  const [apiToken, setApiToken] = useState('')
  const [model, setModel] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    // Validation
    const newErrors: Record<string, string> = {}
    if (!accountId) newErrors.accountId = t('cloudflare.validation.accountIdRequired')
    if (!apiToken) newErrors.apiToken = t('cloudflare.validation.apiTokenRequired')
    if (!model) newErrors.model = t('cloudflare.validation.modelRequired')

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)
    setErrors({})

    try {
      await saveSettings({ accountId, apiToken, model })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      setErrors({ general: t('cloudflare.messages.saveError', { error: error.message }) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('cloudflare.settings.title')}</CardTitle>
        <CardDescription>{t('cloudflare.settings.description')}</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
          {/* Account ID Field */}
          <div className="space-y-2">
            <Label htmlFor="account-id">
              {t('cloudflare.settings.accountId')}
              <span aria-label={t('common.required')}> *</span>
            </Label>
            <Input
              id="account-id"
              type="text"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              placeholder={t('cloudflare.settings.accountIdPlaceholder')}
              aria-label={t('cloudflare.ariaLabels.accountIdInput')}
              aria-describedby={errors.accountId ? 'account-id-error account-id-desc' : 'account-id-desc'}
              aria-invalid={!!errors.accountId}
              aria-required={true}
              className={errors.accountId ? 'border-red-500' : ''}
            />
            <p id="account-id-desc" className="text-sm text-muted-foreground">
              {t('cloudflare.settings.accountIdDescription')}
            </p>
            {errors.accountId && (
              <p id="account-id-error" role="alert" className="text-sm text-red-600">
                {errors.accountId}
              </p>
            )}
          </div>

          {/* API Token Field */}
          <div className="space-y-2 mt-4">
            <Label htmlFor="api-token">
              {t('cloudflare.settings.apiToken')}
              <span aria-label={t('common.required')}> *</span>
            </Label>
            <Input
              id="api-token"
              type="password"
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
              placeholder={t('cloudflare.settings.apiTokenPlaceholder')}
              aria-label={t('cloudflare.ariaLabels.apiTokenInput')}
              aria-describedby={errors.apiToken ? 'api-token-error api-token-desc' : 'api-token-desc'}
              aria-invalid={!!errors.apiToken}
              aria-required={true}
              className={errors.apiToken ? 'border-red-500' : ''}
            />
            <p id="api-token-desc" className="text-sm text-muted-foreground">
              {t('cloudflare.settings.apiTokenDescription')}
            </p>
            {errors.apiToken && (
              <p id="api-token-error" role="alert" className="text-sm text-red-600">
                {errors.apiToken}
              </p>
            )}
          </div>

          {/* Model Selection */}
          <div className="space-y-2 mt-4">
            <Label htmlFor="model">
              {t('cloudflare.settings.defaultModel')}
              <span aria-label={t('common.required')}> *</span>
            </Label>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger
                id="model"
                aria-label={t('cloudflare.ariaLabels.modelSelect')}
                aria-invalid={!!errors.model}
                aria-required={true}
              >
                <SelectValue placeholder={t('cloudflare.settings.selectModel')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="llama-4-scout">
                  {t('cloudflare.models.llama4Scout')}
                </SelectItem>
                <SelectItem value="llama-3.3-70b">
                  {t('cloudflare.models.llama33Fast')}
                </SelectItem>
                <SelectItem value="llama-3.1-8b">
                  {t('cloudflare.models.llama31')}
                </SelectItem>
              </SelectContent>
            </Select>
            {errors.model && (
              <p role="alert" className="text-sm text-red-600">
                {errors.model}
              </p>
            )}
          </div>

          {/* General Error */}
          {errors.general && (
            <div role="alert" className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
              <p className="text-sm text-red-600">{errors.general}</p>
            </div>
          )}

          {/* Success Message */}
          {saved && (
            <div role="status" className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
              <p className="text-sm text-green-600">
                {t('cloudflare.messages.saveSuccess')}
              </p>
            </div>
          )}
        </form>
      </CardContent>

      <CardFooter className="flex gap-2">
        <Button
          onClick={handleSave}
          disabled={loading}
          aria-label={t('cloudflare.ariaLabels.saveButton')}
          aria-busy={loading}
        >
          {loading ? t('common.saving') : t('cloudflare.settings.saveButton')}
        </Button>

        {loading && (
          <span role="status" aria-live="polite" className="sr-only">
            {t('common.saving')}
          </span>
        )}
      </CardFooter>
    </Card>
  )
}
```

**This example demonstrates**:
- ✅ 100% i18n coverage (all strings use `t()`)
- ✅ All form fields properly labeled
- ✅ ARIA attributes on all inputs
- ✅ Error states announced to screen readers
- ✅ Loading states announced
- ✅ Success messages announced
- ✅ Required fields indicated visually and to AT
- ✅ Keyboard accessible throughout
- ✅ Focus management
- ✅ Semantic HTML structure

---

## Part 4: Validation & Testing

### Pre-Commit Validation

**i18n Validation**:
```bash
cd /mnt/development/fe2/fe2/apps/web
node scripts/check-translations.js
```

**Accessibility Validation**:
```bash
cd /mnt/development/fe2/fe2/apps/web
npm run lint | grep "jsx-a11y"
npm run test:a11y
```

### Manual Testing

**Keyboard Testing**:
1. Unplug your mouse
2. Navigate entire feature using only Tab, Enter, Space, Escape, Arrow keys
3. Verify all features are accessible
4. Verify focus indicators are visible
5. Verify Tab order is logical

**Screen Reader Testing**:
- **Windows**: NVDA (free) or JAWS
- **macOS**: VoiceOver (built-in, Cmd+F5)
- **Linux**: Orca

**Test checklist**:
- [ ] All text content read correctly
- [ ] Form labels announced
- [ ] Error messages announced
- [ ] Loading states announced
- [ ] Interactive elements identified correctly
- [ ] ARIA labels provide clear context

### Browser Testing

Test in multiple browsers with accessibility features:
- Chrome + ChromeVox
- Firefox + NVDA
- Safari + VoiceOver
- Edge + Narrator

---

## Part 5: Resources & Documentation

### Official Documentation

**Internationalization**:
- I18N Quick Start Guide (`/mnt/development/fe2/fe2/I18N_QUICK_START.md` in the FE2 repo)
- I18N Critical Patterns (`/mnt/development/fe2/fe2/I18N_CRITICAL_PATTERNS.md` in the FE2 repo)
- [react-i18next Documentation](https://react.i18next.com/)

**Accessibility**:
- FE2 Accessibility Standards (`/mnt/development/fe2/fe2/ACCESSIBILITY.md` in the FE2 repo)
- FE2 i18n & Accessibility Guide (`/mnt/development/fe2/fe2/docs/argus/fe2/i18n-accessibility.md`)
- [WCAG 2.2 Guidelines](https://www.w3.org/WAI/WCAG22/quickref/)
- [MDN ARIA Guide](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA)

### Testing Tools

**Accessibility Testing**:
- [axe DevTools](https://www.deque.com/axe/devtools/) (Browser extension)
- [WAVE](https://wave.webaim.org/) (Browser extension)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) (Built into Chrome)
- [Pa11y](https://pa11y.org/) (Command-line tool)

**Color Contrast**:
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Contrast Ratio](https://contrast-ratio.com/)

**Screen Readers**:
- [NVDA](https://www.nvaccess.org/) (Windows, free)
- [JAWS](https://www.freedomscientific.com/products/software/jaws/) (Windows, paid)
- [VoiceOver](https://www.apple.com/accessibility/voiceover/) (macOS/iOS, built-in)
- [Orca](https://help.gnome.org/users/orca/stable/) (Linux, free)

---

## Summary

### What You MUST Do

**i18n Requirements**:
1. ✅ Create English translation file in `/en/[feature].json`
2. ✅ Use `useTranslation()` hook in all components
3. ✅ Use `t('key.path')` for ALL user-facing strings
4. ✅ Never hardcode English strings
5. ✅ Include ARIA label translations
6. ✅ Run validation: `node scripts/check-translations.js`

**Accessibility Requirements**:
1. ✅ All interactive elements support keyboard (Enter/Space)
2. ✅ All custom interactive elements have `role`, `tabIndex`, `aria-label`
3. ✅ All form fields have proper labels and ARIA attributes
4. ✅ Error/loading states announced to screen readers
5. ✅ Color contrast meets WCAG 2.2 AAA (7:1 for text)
6. ✅ Focus indicators visible on all interactive elements
7. ✅ Run validation: `npm run lint | grep "jsx-a11y"`

### What You MUST NOT Do

❌ Edit `en.json`, `es.json`, or `fr.json` directly (auto-generated)
❌ Hardcode English strings in components
❌ Use `<div>` with `onClick` without keyboard support
❌ Skip ARIA labels on custom interactive elements
❌ Use color alone to convey information
❌ Create keyboard traps
❌ Disable focus indicators

### Before Submitting Code

Run all validation checks:
```bash
cd /mnt/development/fe2/fe2/apps/web

# i18n validation
node scripts/check-translations.js

# Accessibility validation
npm run lint | grep "jsx-a11y"
npm run test:a11y

# Manual keyboard testing
# Manual screen reader testing
```

**All checks MUST pass before merge.**

---

**Questions?** See the resources section or consult existing implementations in the codebase for patterns.

**Last Updated**: 2025-11-10
**Maintained By**: Development Team
**Compliance Required**: 100% before merge
