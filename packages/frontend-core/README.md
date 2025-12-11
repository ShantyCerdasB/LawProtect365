# Frontend Core

Shared business logic, hooks, and utilities for web and mobile applications. This package contains platform-agnostic code that can be reused across different frontend implementations.

## Architecture Overview

We follow **Screaming Architecture** principles, organizing code by business domains rather than technical layers. Each module represents a complete business capability with its own types, use cases, hooks, and interfaces.

### Core Principles

1. **Platform Agnostic**: No web-specific or mobile-specific dependencies. Uses abstractions (ports) for platform concerns.
2. **Single Responsibility**: Each file, function, and module has one clear purpose.
3. **Reusability First**: If code can be shared between web and mobile, it belongs here.
4. **Type Safety**: Strong TypeScript typing throughout, with interfaces for all public APIs.

## Project Structure

```
src/
├── foundation/          # Core infrastructure (HTTP, query, etc.)
├── modules/            # Business domain modules
│   ├── auth/
│   ├── documents/
│   └── ...
└── ports/              # Platform abstraction interfaces
```

## Module Structure

Each module follows a consistent structure:

```
modules/{domain}/
├── api/                # API client functions (HTTP calls)
├── query/              # React Query hooks
├── use-cases/          # Pure business logic functions
├── interfaces/         # Type definitions for hooks/use-cases
├── types/              # Domain types and value objects
├── enums/              # Domain enumerations
├── validation/         # Input validation schemas
└── index.ts            # Barrel export
```

### What Goes Where

**`api/`** - HTTP client functions
- Functions that make API calls using the `HttpClient` abstraction
- No React hooks here, just pure async functions
- Example: `getMe()`, `patchMe()`, `linkProvider()`

**`query/`** - React Query hooks
- Hooks that use `useQuery`, `useMutation`, etc.
- Manage server state and caching
- Example: `useAuth()`, `useDocumentEditing()`

**`use-cases/`** - Pure business logic
- Platform-agnostic functions with no side effects (or controlled side effects)
- Can be tested in isolation
- Example: `formatDate()`, `applyElementsToPdf()`, `getElementAtDisplayPosition()`

**`interfaces/`** - Type definitions
- Interfaces used by hooks and use-cases
- Configuration types, result types, input/output types
- Example: `UseAuthConfig`, `ElementBounds`, `PdfHitTestInput`

**`types/`** - Domain types
- Core domain entities and value objects
- Data structures that represent business concepts
- Example: `SignaturePlacement`, `PDFCoordinates`, `TextPlacement`

**`enums/`** - Enumerations
- Fixed sets of string values
- Replace magic strings throughout the codebase
- Example: `PdfElementType`, `ResizeHandle`, `ControlType`

**`validation/`** - Input validation
- Zod schemas for validating inputs
- Used by API functions and hooks

## Adding a New Module

1. **Create the module directory**:
   ```bash
   mkdir -p src/modules/{your-module}/{api,query,use-cases,interfaces,types,enums,validation}
   ```

2. **Start with types** - Define your domain types first:
   ```typescript
   // types/YourEntity.ts
   export interface YourEntity {
     id: string;
     name: string;
   }
   ```

3. **Add use-cases** - Pure business logic:
   ```typescript
   // use-cases/processEntity.ts
   export function processEntity(entity: YourEntity): ProcessedEntity {
     // Pure logic here
   }
   ```

4. **Create API functions** - HTTP client functions:
   ```typescript
   // api/yourApi.ts
   export function getEntity(client: HttpClient, id: string): Promise<YourEntity> {
     return client.get(`/entities/${id}`);
   }
   ```

5. **Add React Query hooks** - If you need server state:
   ```typescript
   // query/useYourEntity.ts
   export function useYourEntity(config: UseYourEntityConfig) {
     // React Query hook
   }
   ```

6. **Move interfaces** - Extract interfaces to `interfaces/`:
   ```typescript
   // interfaces/YourEntityInterfaces.ts
   export interface UseYourEntityConfig {
     httpClient: HttpClient;
   }
   ```

7. **Create barrel exports** - Add `index.ts` files:
   ```typescript
   // index.ts
   export * from './api';
   export * from './query';
   export * from './use-cases';
   export * from './interfaces';
   export * from './types';
   export * from './enums';
   ```

## Foundation Layer

The `foundation/` directory contains core infrastructure that all modules depend on:

- **`http/`** - HTTP client abstraction (`HttpClient`, `createHttpClient`)
- **`query/`** - React Query utilities (`createQueryClient`, `queryKeys`)

These are low-level utilities that modules use but don't define.

## Ports (Platform Abstractions)

The `ports/` directory defines interfaces for platform-specific functionality:

- **`StoragePort`** - Storage abstraction (localStorage, AsyncStorage, etc.)
- **`FileSystemPort`** - File system operations
- **`NotificationPort`** - Push notifications
- **`AnalyticsPort`** - Analytics tracking

Platform-specific apps (web/mobile) implement these ports using adapters.

## Code Organization Rules

### ✅ DO

- Put reusable logic in `use-cases/`
- Extract interfaces to `interfaces/` folder
- Use enums instead of magic strings
- Create helper functions in `use-cases/helpers/` for complex logic
- Use constants files for magic numbers (`use-cases/constants/`)
- Document all public functions with TSDoc
- Keep functions small and focused (Single Responsibility)

### ❌ DON'T

- Don't import React or React-specific libraries in `use-cases/`
- Don't put web-specific code (DOM, File API) in frontend-core
- Don't create interfaces inside hook files - move them to `interfaces/`
- Don't use hardcoded strings - use enums
- Don't duplicate code - extract to shared helpers
- Don't mix concerns - separate business logic from UI logic

## Example: Documents Module

The `documents` module is a good reference for complex modules:

- **Types**: `SignaturePlacement`, `TextPlacement`, `DatePlacement`
- **Enums**: `PdfElementType`, `ResizeHandle`, `ControlType`
- **Use Cases**: `applyElementsToPdf()`, `getElementAtDisplayPosition()`, `formatDate()`
- **Helpers**: `getElementBounds()`, `hitTestElement()` (in `use-cases/helpers/`)
- **Constants**: `HitTestConstants` (in `use-cases/constants/`)
- **Interfaces**: `ElementBounds`, `UseDocumentEditingConfig`, `ElementHitTestConfig`
- **Query Hooks**: `useDocumentEditing()`, `useDocumentSigning()`, `useElementHandlers()`

## Testing

All use-cases should be unit tested. Hooks can be tested with React Testing Library. Aim for 90%+ code coverage.

## Building

```bash
npm run build
```

This compiles TypeScript to the `dist/` directory. The package is consumed by `apps/web` and future `apps/mobile`.

