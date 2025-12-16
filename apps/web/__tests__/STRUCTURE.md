# Test Structure Summary

## Overview

This document summarizes the test structure and organization for the `@lawprotect/web` application. All tests follow a consistent structure to ensure maintainability and reusability.

## Directory Structure

```
__tests__/
├── helpers/                    # Reusable test utilities
│   ├── factories/             # Factory functions
│   │   ├── componentFactories.ts
│   │   ├── hookFactories.ts
│   │   ├── queryFactories.ts
│   │   ├── routerFactories.ts
│   │   └── index.ts
│   ├── fixtures/              # Pre-configured test data
│   │   ├── componentFixtures.ts
│   │   ├── dataFixtures.ts
│   │   ├── routeFixtures.ts
│   │   ├── fixtures.ts
│   │   └── index.ts
│   ├── mocks/                 # Mock implementations
│   │   ├── browserMocks.ts
│   │   ├── reactQueryMocks.ts
│   │   ├── routerMocks.ts
│   │   └── index.ts
│   ├── utils/                 # Utility functions
│   │   ├── assertions.ts
│   │   ├── renderUtils.ts
│   │   ├── waitUtils.ts
│   │   ├── queryUtils.ts
│   │   ├── formUtils.ts
│   │   └── index.ts
│   ├── index.ts               # Main barrel export
│   ├── fixtures.ts            # Legacy fixtures
│   ├── mocks.ts               # Legacy mocks
│   ├── test-helpers.ts        # Legacy helpers (deprecated)
│   └── README.md              # Helpers documentation
├── app/                       # App-level tests
│   ├── adapters/
│   ├── config/
│   ├── layout/
│   ├── providers/
│   └── store/
├── ui-kit/                    # UI component tests
│   ├── buttons/
│   ├── forms/
│   ├── feedback/
│   ├── modals/
│   └── [components]/
├── modules/                   # Feature module tests
│   ├── home/
│   ├── documents/
│   ├── auth/
│   └── [features]/
├── setup.ts                   # Global test setup
├── TESTING.md                 # Complete testing guide
├── COVERAGE.md                # Coverage guide
└── STRUCTURE.md               # This file
```

## Key Principles

### 1. Reusability

All test utilities are designed to be reusable across test files:
- **Factories**: Create test objects with sensible defaults
- **Fixtures**: Provide pre-configured test data
- **Mocks**: Mock external dependencies consistently
- **Utils**: Provide common test operations

### 2. Type Safety

All helpers are fully typed with TypeScript:
- Factory functions use generics for type safety
- Fixtures use `as const` for literal types
- Utilities have proper type annotations

### 3. Documentation

All helpers include comprehensive TSDoc:
- `@fileoverview` with `@summary` and `@description`
- `@param` for all parameters
- `@returns` for return values
- `@throws` for error conditions

### 4. Consistency

Tests follow consistent patterns:
- Use `renderWithProviders` for components
- Use factories for props
- Use fixtures for data
- Use utilities for assertions and interactions

## Import Patterns

### Single Import (Recommended)

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

### Specific Imports

```typescript
import { renderWithProviders } from '@/__tests__/helpers/utils/renderUtils';
import { createButtonProps } from '@/__tests__/helpers/factories/componentFactories';
import { userFixtures } from '@/__tests__/helpers/fixtures/dataFixtures';
```

## Test Organization

### Component Tests

```
__tests__/ui-kit/buttons/Button.test.tsx
```

**Structure:**
1. Imports
2. Describe block for component
3. Setup/teardown if needed
4. Test cases organized by feature

### Hook Tests

```
__tests__/modules/documents/hooks/useDocumentQuery.test.ts
```

**Structure:**
1. Imports
2. Describe block for hook
3. Mock setup
4. Test cases for different states

### Page Tests

```
__tests__/modules/home/pages/HomePage.test.tsx
```

**Structure:**
1. Imports
2. Describe block for page
3. Router/Query setup
4. Test cases for page rendering and interactions

## Coverage Goals

- **Target**: 95% coverage across all metrics
- **Statements**: 95%
- **Branches**: 95%
- **Functions**: 95%
- **Lines**: 95%

## Best Practices

1. **Always use helpers**: Use provided utilities instead of writing custom test code
2. **Use factories**: Create props with factories instead of manual objects
3. **Use fixtures**: Use pre-configured data instead of creating inline objects
4. **Test user behavior**: Test what users see/do, not implementation details
5. **Test edge cases**: Test null, undefined, empty states
6. **Test error paths**: Test error handling and validation failures
7. **Keep tests isolated**: Each test should be independent
8. **Follow AAA pattern**: Arrange-Act-Assert

## Next Steps

1. Review `TESTING.md` for complete testing guide
2. Review `COVERAGE.md` for coverage strategies
3. Review `helpers/README.md` for helper documentation
4. Write tests for uncovered code
5. Run coverage report to identify gaps
6. Achieve 95% coverage target

## Resources

- [TESTING.md](./TESTING.md) - Complete testing documentation
- [COVERAGE.md](./COVERAGE.md) - Coverage guide
- [helpers/README.md](./helpers/README.md) - Helper functions documentation
- [React Testing Library](https://testing-library.com/react) - Official documentation

