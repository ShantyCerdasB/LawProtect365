# Web Application

The main web application built with React, Vite, and Tailwind CSS. This is where all web-specific UI components, pages, and platform-specific implementations live.

## Architecture Overview

We follow **Screaming Architecture** principles, organizing code by business features rather than technical layers. Each module represents a complete user-facing feature with its own components, pages, hooks, and routes.

### Core Principles

1. **Feature-First Organization**: Code is organized by what the user does, not by technical concerns.
2. **Reuse from Core**: Business logic comes from `@lawprotect/frontend-core`, not duplicated here.
3. **Web-Specific Only**: Only code that can't be shared with mobile belongs here.
4. **Component Composition**: Build complex UIs from small, reusable components.

## Project Structure

```
src/
├── app/                # Application setup (routing, providers, config)
├── modules/            # Feature modules (Screaming Architecture)
│   ├── documents/
│   ├── auth/
│   └── ...
├── ui-kit/             # Shared UI components (buttons, modals, forms)
└── style.css           # Global styles and Tailwind config
```

## Module Structure

Each feature module follows this structure:

```
modules/{feature}/
├── components/         # React components (UI)
├── pages/              # Page components (routes)
├── hooks/              # Web-specific React hooks
├── handlers/           # Event handlers and business logic adapters
├── interfaces/         # Web-specific type definitions
├── types/              # Component prop types
├── utils/              # Web-specific utilities (DOM, File API, etc.)
├── routes.tsx          # Route definitions
└── index.ts            # Barrel export
```

### What Goes Where

**`components/`** - Reusable UI components
- Presentational components that render UI
- Can be used across multiple pages
- Example: `PDFViewer`, `SignatureCanvas`, `ElementTypePopover`

**`pages/`** - Page-level components
- Top-level components for routes
- Compose components and hooks
- Example: `SignDocumentPage`, `HomePage`

**`hooks/`** - Web-specific React hooks
- Hooks that use web APIs (File API, DOM, etc.)
- State management for UI concerns
- Example: `usePdfFileUpload()`, `useModalState()`, `usePdfPageRenderer()`

**`handlers/`** - Event handlers and adapters
- Classes or functions that bridge React events to frontend-core logic
- Convert web events to platform-agnostic formats
- Example: `WebElementInteractionHandler`

**`interfaces/`** - Web-specific type definitions
- Types for hooks, handlers, and web-specific components
- Configuration types that use web APIs
- Example: `UsePdfFileUploadResult`, `WebElementInteractionHandlerConfig`

**`types/`** - Component prop types
- Type definitions for component props
- Usually simple interfaces for component configuration
- Example: `PDFViewerProps`, `SignatureCanvasProps`

**`utils/`** - Web-specific utilities
- Functions that use browser APIs
- DOM manipulation, file downloads, etc.
- Example: `downloadPdfFile()`

**`routes.tsx`** - Route definitions
- React Router route configuration
- Lazy loading, route guards, etc.

## Adding a New Feature Module

1. **Create the module directory**:
   ```bash
   mkdir -p src/modules/{your-feature}/{components,pages,hooks,interfaces,types,utils}
   ```

2. **Start with types** - Define your component prop types:
   ```typescript
   // types/YourComponent.ts
   export interface YourComponentProps {
     title: string;
     onAction: () => void;
   }
   ```

3. **Create components** - Build your UI:
   ```typescript
   // components/YourComponent.tsx
   export function YourComponent({ title, onAction }: YourComponentProps) {
     return <div>{title}</div>;
   }
   ```

4. **Add hooks if needed** - For web-specific state:
   ```typescript
   // hooks/useYourFeature.ts
   export function useYourFeature() {
     // Web-specific hook using File API, DOM, etc.
   }
   ```

5. **Move interfaces** - Extract to `interfaces/`:
   ```typescript
   // interfaces/YourFeatureInterfaces.ts
   export interface UseYourFeatureResult {
     // Hook return type
   }
   ```

6. **Create pages** - Compose everything:
   ```typescript
   // pages/YourFeaturePage.tsx
   export function YourFeaturePage() {
     // Compose components and hooks
   }
   ```

7. **Add routes** - Define navigation:
   ```typescript
   // routes.tsx
   export const yourFeatureRoutes = {
     path: '/your-feature',
     element: <YourFeaturePage />
   };
   ```

8. **Create barrel exports**:
   ```typescript
   // index.ts
   export * from './components';
   export * from './pages';
   export * from './routes';
   ```

## Using Frontend Core

Import business logic from `@lawprotect/frontend-core`:

```typescript
import { useAuth, useDocumentEditing } from '@lawprotect/frontend-core';
import type { PdfElementType } from '@lawprotect/frontend-core';
```

**Rule of thumb**: If it uses React but not web APIs → frontend-core. If it uses web APIs (File, DOM, etc.) → apps/web.

## UI Kit

The `ui-kit/` directory contains reusable UI components used across all modules:

- **`buttons/`** - Button components
- **`forms/`** - Form inputs and controls
- **`modals/`** - Modal dialogs
- **`feedback/`** - Alerts, toasts, spinners
- **`layout/`** - Layout components
- **`navigation/`** - Navigation components
- **`tables/`** - Data tables

These are shared across features and should be generic and reusable.

## Styling

We use **Tailwind CSS** with a custom color palette defined in `style.css`:

- `blue` (#1d4878) - Primary brand color
- `blue-dark` (#003454) - Darker variant
- `emerald` (#5e9594) - Success/info states
- `emerald-dark` (#12626d) - Darker variant
- `burgundy` (#a32439) - Error/danger states
- `gray` (#444b59) - Text, borders, backgrounds
- `white` (#ffffff) - Pure white

Always use these colors instead of generic Tailwind colors (slate, sky, etc.) for consistency.

## Code Organization Rules

### ✅ DO

- Import business logic from `@lawprotect/frontend-core`
- Put web-specific code (File API, DOM) in `hooks/` or `utils/`
- Extract interfaces to `interfaces/` folder
- Use the UI kit components for common UI patterns
- Follow the color palette from `style.css`
- Keep components small and focused
- Document components with TSDoc

### ❌ DON'T

- Don't duplicate business logic - use frontend-core
- Don't put platform-agnostic code here - it belongs in frontend-core
- Don't create interfaces inside component files - move to `interfaces/`
- Don't use generic Tailwind colors - use the project palette
- Don't mix feature code with app setup code
- Don't create global state unless necessary - prefer local state or React Query

## Example: Documents Module

The `documents` module shows a complete feature implementation:

- **Components**: `PDFViewer`, `SignatureCanvas`, `TextInputModal`, `DateInputModal`
- **Pages**: `SignDocumentPage`
- **Hooks**: `usePdfFileUpload()`, `usePdfPageRenderer()`, `usePdfElementOverlay()`
- **Handlers**: `WebElementInteractionHandler` (bridges React events to frontend-core)
- **Interfaces**: `UsePdfFileUploadResult`, `PdfPageRenderMetrics`, etc.
- **Types**: Component prop types
- **Utils**: `downloadPdfFile()` (uses browser download API)

Notice how it uses `@lawprotect/frontend-core` for business logic (`useDocumentEditing`, `formatDate`, etc.) and only implements web-specific concerns here.

## Development

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Type check
npm run typecheck
```

## Deployment

The app is deployed to S3 + CloudFront. The build output goes to `dist/` and is served as static files.

