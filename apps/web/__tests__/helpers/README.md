# Test Helpers Documentation

## Overview

This directory contains reusable test utilities, factories, fixtures, mocks, and helper functions for testing the `@lawprotect/web` application. All helpers are designed to reduce code duplication and ensure consistency across test files.

## Directory Structure

```
helpers/
├── factories/          # Factory functions for creating test objects
├── fixtures/           # Pre-configured test data
├── mocks/              # Mock implementations
├── utils/              # Utility functions
├── index.ts            # Main barrel export
├── fixtures.ts         # Legacy fixtures (barrel)
├── mocks.ts            # Legacy mocks (barrel)
└── test-helpers.ts     # Legacy helpers (deprecated)
```

## Quick Start

Import all helpers from the main barrel export:

```typescript
import {
  renderWithProviders,
  createButtonProps,
  buttonFixtures,
  userFixtures,
  mockRouter,
  assertButtonEnabled,
  fillTextField,
  renderQueryHook,
} from '@/__tests__/helpers';
```

## Factories

Factories create test objects with sensible defaults that can be customized.

### Component Factories

```typescript
import { createButtonProps, createTextFieldProps } from '@/__tests__/helpers';

const buttonProps = createButtonProps({ variant: 'primary' });
const textFieldProps = createTextFieldProps({ label: 'Email', name: 'email' });
```

**Available:**
- `createButtonProps()` - Button component props
- `createIconButtonProps()` - IconButton props
- `createTextFieldProps()` - TextField props
- `createSelectProps()` - Select props
- `createModalProps()` - Modal props
- `createAlertProps()` - Alert props

### Hook Factories

```typescript
import { createTestQueryClientConfig, createRouterTestConfig } from '@/__tests__/helpers';

const queryConfig = createTestQueryClientConfig({ retry: false });
const routerConfig = createRouterTestConfig({ initialEntries: ['/home'] });
```

### Router Factories

```typescript
import { createRouterConfig, createMockNavigate } from '@/__tests__/helpers';

const routerConfig = createRouterConfig('/documents');
const navigate = createMockNavigate();
```

## Fixtures

Fixtures provide pre-configured test data that can be used directly or extended.

### Component Fixtures

```typescript
import { buttonFixtures, modalFixtures } from '@/__tests__/helpers';

render(<Button {...buttonFixtures.primary} />);
render(<Modal {...modalFixtures.basic} />);
```

**Available:**
- `buttonFixtures` - Button variants (primary, secondary, outline, disabled)
- `modalFixtures` - Modal configurations (basic, confirm)
- `formFieldFixtures` - Form field props (textField, select)

### Data Fixtures

```typescript
import { userFixtures, documentFixtures, fileFixtures } from '@/__tests__/helpers';

const user = userFixtures.authenticated;
const document = documentFixtures.signed;
const pdfFile = fileFixtures.pdf;
```

**Available:**
- `userFixtures` - User objects (basic, authenticated, admin)
- `documentFixtures` - Document objects (basic, signed)
- `fileFixtures` - File objects (pdf, image, large)
- `apiResponseFixtures` - API responses (success, error, validationError)

### Route Fixtures

```typescript
import { routeFixtures } from '@/__tests__/helpers';

const loginRoute = routeFixtures.auth.login;
const documentSignRoute = routeFixtures.documents.sign;
```

## Mocks

Mocks provide implementations of external dependencies for testing.

### Browser Mocks

```typescript
import { createMockLocalStorage, mockMatchMedia } from '@/__tests__/helpers';

const localStorage = createMockLocalStorage();
localStorage.setItem('key', 'value');
mockMatchMedia(true);
```

**Available:**
- `createMockLocalStorage()` - localStorage implementation
- `createMockSessionStorage()` - sessionStorage implementation
- `mockWindowLocation()` - window.location mock
- `mockMatchMedia()` - matchMedia mock
- `mockIntersectionObserver()` - IntersectionObserver mock
- `mockResizeObserver()` - ResizeObserver mock
- `createMockFileReader()` - FileReader mock

### React Query Mocks

```typescript
import { createTestQueryClient } from '@/__tests__/helpers';

const queryClient = createTestQueryClient({ retry: false });
```

### Router Mocks

```typescript
import { mockRouter, mockUseNavigate, mockUseLocation } from '@/__tests__/helpers';

const router = mockRouter('/documents');
const { navigate, mockHook } = mockUseNavigate();
const { location, mockHook } = mockUseLocation({ pathname: '/home' });
```

## Utilities

### Render Utilities

Render components with necessary providers automatically:

```typescript
import { renderWithProviders } from '@/__tests__/helpers';

renderWithProviders(<MyComponent />, {
  queryClient: customQueryClient,
  initialEntries: ['/home'],
});
```

**Available:**
- `renderWithProviders()` - Full wrapper (QueryClient + Router)
- `createQueryClientWrapper()` - QueryClient-only wrapper
- `createRouterWrapper()` - Router-only wrapper
- `createAppWrapper()` - Combined wrapper factory

### Assertion Utilities

Custom assertion functions for common patterns:

```typescript
import { assertButtonEnabled, assertTextInDocument } from '@/__tests__/helpers';

assertButtonEnabled('Submit');
assertTextInDocument('Welcome');
```

**Available:**
- `assertButtonEnabled()` / `assertButtonDisabled()`
- `assertInputValue()`
- `assertTextInDocument()` / `assertTextNotInDocument()`
- `assertElementHasClass()`
- `assertLinkHref()`
- `assertFieldError()`

### Wait Utilities

Utilities for waiting on async operations:

```typescript
import { waitForElement, waitForCondition } from '@/__tests__/helpers';

await waitForElement(() => screen.getByRole('button'));
await waitForCondition(() => isLoading === false);
```

**Available:**
- `waitForElement()` - Wait for element to appear
- `waitForElementRemoval()` - Wait for element to disappear
- `waitForText()` - Wait for text to appear
- `waitForCondition()` - Wait for condition to be true
- `delay()` - Create artificial delay

### Form Utilities

Utilities for testing form interactions:

```typescript
import { fillTextField, submitForm, assertFieldValid } from '@/__tests__/helpers';

await fillTextField('Email', 'test@example.com');
await submitForm('Submit');
assertFieldValid('Email');
```

**Available:**
- `fillTextField()` - Fill text input
- `fillSelectField()` - Select option
- `toggleCheckbox()` - Toggle checkbox
- `submitForm()` - Submit form
- `fillFormFields()` - Fill multiple fields
- `assertFieldValidationError()` / `assertFieldValid()`
- `assertFieldValue()`
- `assertFieldRequired()`
- `assertFieldDisabled()` / `assertFieldEnabled()`
- `waitForFieldError()`

### Query Utilities

Utilities for testing React Query hooks:

```typescript
import { renderQueryHook, assertQuerySuccess } from '@/__tests__/helpers';

const { result } = renderQueryHook(() => useMyQuery());
assertQuerySuccess(result.current);
```

**Available:**
- `renderQueryHook()` - Render query hook
- `renderMutationHook()` - Render mutation hook
- `waitForQueryState()` - Wait for query state
- `assertQueryLoading()` - Assert loading state
- `assertQuerySuccess()` - Assert success state
- `assertQueryError()` - Assert error state

## Best Practices

1. **Use Factories for Props**: Create component props with factories instead of manual objects
2. **Use Fixtures for Data**: Use pre-configured fixtures for test data
3. **Mock External Dependencies**: Always mock browser APIs and external services
4. **Use Render Utilities**: Always use `renderWithProviders` for components needing providers
5. **Use Assertion Utilities**: Use custom assertions for common patterns
6. **Await Async Operations**: Always await async operations in tests

## Type Safety

All helpers are fully typed with TypeScript. Factory functions use generic types and optional overrides to maintain type safety while providing flexibility.

```typescript
const props = createButtonProps({ variant: 'primary' }); // TypeScript knows variant is 'primary'
```

## Documentation

Each helper function includes TSDoc documentation with:
- `@description` - What the function does
- `@param` - Parameters with types and descriptions
- `@returns` - Return value description
- `@throws` - Errors that can be thrown

Check individual files for detailed documentation on each helper.














