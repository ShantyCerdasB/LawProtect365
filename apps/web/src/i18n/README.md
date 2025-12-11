# Internationalization (i18n)

This project uses i18next for managing translations across the application. Translations are organized by business module to keep things maintainable as the app grows.

## Where translations live

Translations are split between two locations based on what they're used for:

**`packages/frontend-core/src/i18n/locales/`** - Source of truth for shared translations
- Used by both web and mobile apps
- Contains common UI elements, API errors, validation messages, and all business module translations
- Structure: `{lang}/common.json`, `{lang}/errors.json`, `{lang}/validation.json`, `{lang}/modules/{module}.json`

**`apps/web/src/i18n/locales/`** - Web-specific translations
- `shared/` - Synced copies from frontend-core (needed for TypeScript imports)
- `{lang}/layout.json` - Web-only UI like header, menu, footer

## Syncing translations

The `shared/` folder contains copies of frontend-core translations. These get synced automatically during build, or you can run:

```bash
npm run sync:i18n
```

This copies all translation files from frontend-core to the web app so TypeScript can resolve the imports properly.

## Using translations in components

Basic usage with a single namespace:

```typescript
import { useTranslation } from '@lawprotect/frontend-core';

function DocumentSigner() {
  const { t } = useTranslation('documents');
  
  return (
    <div>
      <h1>{t('signing.title')}</h1>
      <button>{t('signing.uploadPdf')}</button>
    </div>
  );
}
```

Using multiple namespaces:

```typescript
import { useTranslation } from '@lawprotect/frontend-core';

function MyComponent() {
  const { t } = useTranslation(['documents', 'common']);
  
  return (
    <div>
      <h1>{t('documents:signing.title')}</h1>
      <button>{t('common:buttons.save')}</button>
    </div>
  );
}
```

Translating API errors:

```typescript
import { useTranslation, translateApiError } from '@lawprotect/frontend-core';

function ErrorMessage({ error }: { error: HttpError }) {
  const { t } = useTranslation('errors');
  const message = translateApiError(t, {
    code: error.code,
    field: error.field,
    params: error.params,
  });
  
  return <div className="error">{message}</div>;
}
```

## Adding new translations

1. Edit the source file in `packages/frontend-core/src/i18n/locales/{lang}/modules/{module}.json`
2. Run `npm run sync:i18n` to copy to web app
3. Use in your component with `t('module.key')`

Example:

```json
// packages/frontend-core/src/i18n/locales/en/modules/documents.json
{
  "signing": {
    "newFeature": "New Feature Label"
  }
}
```

```typescript
const { t } = useTranslation('documents');
t('signing.newFeature');
```

## Organization rules

- Shared across modules → `frontend-core/common.json`, `errors.json`, `validation.json`
- Module-specific → `frontend-core/modules/{module}.json`
- Web-only UI → `apps/web/locales/{lang}/layout.json`
- If a file grows beyond 200-300 lines, consider splitting it into sub-modules

## Available namespaces

- `common` - Generic buttons and actions
- `errors` - API error messages
- `validation` - Form validation messages
- `layout` - Web header, menu, footer
- `auth` - Authentication flows
- `documents` - Document signing and editing
- `users` - User management
- `payments` - Payment processing
- `memberships` - Membership plans
- `cases` - Case management
- `calendar` - Calendar and events
- `notifications` - Notifications
- `kyc` - KYC verification
- `admin` - Admin dashboard
