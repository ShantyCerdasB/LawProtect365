# Testing Documentation

## Overview

This document describes the testing strategy, structure, and best practices for the `@lawprotect/web` application. The goal is to maintain **95% code coverage** while writing maintainable, reusable tests that avoid code duplication.

## Test Structure

Tests are organized to mirror the source code structure, making it easy to locate and maintain test files:

```
apps/web/
├── __tests__/
│   ├── helpers/                    # Shared test utilities
│   │   ├── factories/             # Factory functions for creating test objects
│   │   │   ├── componentFactories.ts
│   │   │   ├── hookFactories.ts
│   │   │   ├── queryFactories.ts
│   │   │   ├── routerFactories.ts
│   │   │   └── index.ts
│   │   ├── mocks/                 # Mock implementations
│   │   │   ├── browserMocks.ts   # Browser API mocks
│   │   │   ├── reactQueryMocks.ts
│   │   │   ├── routerMocks.ts
│   │   │   └── index.ts
│   │   ├── fixtures/              # Test data fixtures
│   │   │   ├── componentFixtures.ts
│   │   │   ├── dataFixtures.ts
│   │   │   ├── routeFixtures.ts
│   │   │   ├── fixtures.ts
│   │   │   └── index.ts
│   │   ├── utils/                 # Test utility functions
│   │   │   ├── assertions.ts     # Custom assertion helpers
│   │   │   ├── renderUtils.ts    # Render wrapper utilities
│   │   │   ├── waitUtils.ts      # Async wait utilities
│   │   │   ├── queryUtils.ts     # React Query testing utilities
│   │   │   ├── formUtils.ts      # Form testing utilities
│   │   │   └── index.ts
│   │   ├── mocks.ts              # Re-export all mocks (barrel)
│   │   ├── fixtures.ts           # Re-export all fixtures (barrel)
│   │   ├── test-helpers.ts       # Legacy helpers (deprecated)
│   │   └── index.ts              # Main barrel export
│   ├── setup.ts                   # Global test setup
│   ├── app/                       # Tests for app-level code
│   │   ├── providers/
│   │   ├── routing/
│   │   ├── store/
│   │   ├── adapters/
│   │   ├── config/
│   │   └── layout/
│   ├── ui-kit/                    # Tests for UI components
│   │   ├── buttons/
│   │   ├── forms/
│   │   ├── layout/
│   │   ├── modals/
│   │   ├── feedback/
│   │   └── navigation/
│   ├── modules/                   # Tests for feature modules
│   │   ├── home/
│   │   ├── documents/
│   │   ├── auth/
│   │   └── [feature]/
│   └── [same structure as src/]
└── src/
```

## Test File Naming

- **Component tests**: `ComponentName.test.tsx`
- **Hook tests**: `useHookName.test.ts`
- **Utility tests**: `utilityName.test.ts`
- **Page tests**: `PageName.test.tsx`

## Running Tests

```bash
# Run all tests
npm run test:unit

# Run tests in watch mode
npm run test:unit:watch

# Run tests with coverage report
npm run test:unit:coverage

# Run specific test file
npm run test:unit -- Button.test.tsx

# Run tests matching a pattern
npm run test:unit -- --testPathPattern=buttons
```

## Test Helpers Architecture

### Importing Helpers

All test helpers are available through a single import:

```typescript
import {
  renderWithProviders,
  createButtonProps,
  userFixtures,
  mockRouter,
  assertButtonEnabled,
  fillTextField,
  renderQueryHook,
} from '@/__tests__/helpers';
```

### Factories

Factories create test objects with sensible defaults that can be customized:

```typescript
import { createButtonProps } from '@/__tests__/helpers';

const props = createButtonProps({ variant: 'primary' });
```

**Available Factories:**
- `createButtonProps()` - Button component props
- `createIconButtonProps()` - IconButton props
- `createTextFieldProps()` - TextField props
- `createSelectProps()` - Select props
- `createModalProps()` - Modal props
- `createAlertProps()` - Alert props
- `createTestQueryClient()` - React Query client
- `createRouterConfig()` - Router configuration
- `createMockNavigate()` - Mock navigate function

### Fixtures

Fixtures provide pre-configured test data:

```typescript
import { buttonFixtures, userFixtures, routeFixtures } from '@/__tests__/helpers';

render(<Button {...buttonFixtures.primary} />);
const user = userFixtures.authenticated;
const loginRoute = routeFixtures.auth.login;
```

**Available Fixtures:**
- `buttonFixtures` - Button component props
- `modalFixtures` - Modal configurations
- `formFieldFixtures` - Form field props
- `userFixtures` - User data objects
- `documentFixtures` - Document data objects
- `fileFixtures` - File objects
- `apiResponseFixtures` - API response data
- `routeFixtures` - Route paths

### Mocks

Mocks provide implementations of external dependencies:

```typescript
import { mockRouter, createMockLocalStorage } from '@/__tests__/helpers';

const router = mockRouter({ pathname: '/documents' });
const localStorage = createMockLocalStorage();
```

**Available Mocks:**
- `mockRouter()` - Router configuration
- `mockUseNavigate()` - useNavigate hook mock
- `mockUseLocation()` - useLocation hook mock
- `createMockLocalStorage()` - localStorage mock
- `createMockSessionStorage()` - sessionStorage mock
- `mockMatchMedia()` - matchMedia mock
- `mockIntersectionObserver()` - IntersectionObserver mock
- `mockResizeObserver()` - ResizeObserver mock
- `createMockFileReader()` - FileReader mock
- `createTestQueryClient()` - React Query client

### Utils

Utils provide reusable test logic:

#### Render Utils

```typescript
import { renderWithProviders } from '@/__tests__/helpers';

renderWithProviders(<MyComponent />, { initialEntries: ['/home'] });
```

**Available Render Utils:**
- `renderWithProviders()` - Renders with QueryClient and Router
- `createQueryClientWrapper()` - QueryClient-only wrapper
- `createRouterWrapper()` - Router-only wrapper
- `createAppWrapper()` - Combined wrapper

#### Assertion Utils

```typescript
import { assertButtonEnabled, assertTextInDocument } from '@/__tests__/helpers';

assertButtonEnabled('Submit');
assertTextInDocument('Welcome');
```

**Available Assertions:**
- `assertButtonEnabled()` - Button is enabled
- `assertButtonDisabled()` - Button is disabled
- `assertInputValue()` - Input has value
- `assertTextInDocument()` - Text is present
- `assertTextNotInDocument()` - Text is absent
- `assertElementHasClass()` - Element has CSS class
- `assertLinkHref()` - Link has href
- `assertFieldError()` - Form field shows error

#### Wait Utils

```typescript
import { waitForElement, waitForCondition } from '@/__tests__/helpers';

await waitForElement(() => screen.getByRole('button'));
await waitForCondition(() => someValue === true);
```

**Available Wait Utils:**
- `waitForElement()` - Wait for element to appear
- `waitForElementRemoval()` - Wait for element to disappear
- `waitForText()` - Wait for text to appear
- `waitForCondition()` - Wait for condition to be true
- `delay()` - Create artificial delay

#### Form Utils

```typescript
import { fillTextField, submitForm, assertFieldValid } from '@/__tests__/helpers';

await fillTextField('Email', 'test@example.com');
await submitForm('Submit');
assertFieldValid('Email');
```

**Available Form Utils:**
- `fillTextField()` - Fill text input
- `fillSelectField()` - Select option
- `toggleCheckbox()` - Toggle checkbox
- `submitForm()` - Submit form
- `fillFormFields()` - Fill multiple fields
- `assertFieldValidationError()` - Assert field error
- `assertFieldValid()` - Assert field valid
- `assertFieldValue()` - Assert field value
- `assertFieldRequired()` - Assert field required
- `assertFieldDisabled()` - Assert field disabled
- `assertFieldEnabled()` - Assert field enabled
- `waitForFieldError()` - Wait for validation error

#### Query Utils

```typescript
import { renderQueryHook, assertQuerySuccess } from '@/__tests__/helpers';

const { result } = renderQueryHook(() => useMyQuery());
assertQuerySuccess(result.current);
```

**Available Query Utils:**
- `renderQueryHook()` - Render query hook
- `renderMutationHook()` - Render mutation hook
- `waitForQueryState()` - Wait for query state
- `assertQueryLoading()` - Assert loading state
- `assertQuerySuccess()` - Assert success state
- `assertQueryError()` - Assert error state

## Testing Patterns

### Component Testing

Always use `renderWithProviders` for components that need React Query or Router:

```typescript
import { renderWithProviders, screen } from '@/__tests__/helpers';
import userEvent from '@testing-library/user-event';
import { Button } from '@/ui-kit/buttons/Button';

describe('Button', () => {
  it('should render with text', () => {
    renderWithProviders(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('should call onClick when clicked', async () => {
    const user = userEvent.setup();
    const handleClick = jest.fn();
    renderWithProviders(<Button onClick={handleClick}>Click</Button>);
    
    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Hook Testing

Use `renderHook` with appropriate wrappers:

```typescript
import { renderHook } from '@testing-library/react';
import { createAppWrapper } from '@/__tests__/helpers';
import { useMyHook } from '@/modules/my-module/hooks/useMyHook';

describe('useMyHook', () => {
  it('should return initial state', () => {
    const wrapper = createAppWrapper();
    const { result } = renderHook(() => useMyHook(), { wrapper });
    expect(result.current.value).toBeDefined();
  });
});
```

### React Query Hook Testing

Use query utilities for testing React Query hooks:

```typescript
import { renderQueryHook, assertQuerySuccess } from '@/__tests__/helpers';
import { useDocumentQuery } from '@/modules/documents/hooks/useDocumentQuery';

describe('useDocumentQuery', () => {
  it('should fetch document data', async () => {
    const { result } = renderQueryHook(() => useDocumentQuery('doc-123'));
    
    await waitFor(() => {
      assertQuerySuccess(result.current);
    });
    
    expect(result.current.data).toBeDefined();
  });
});
```

### Form Testing

Use form utilities for testing form interactions:

```typescript
import { fillTextField, submitForm, assertFieldError } from '@/__tests__/helpers';

it('should validate email field', async () => {
  renderWithProviders(<LoginForm />);
  
  await fillTextField('Email', 'invalid-email');
  await submitForm('Login');
  
  assertFieldError('Email', /invalid email/i);
});
```

### Page Testing

Pages typically need both Router and React Query:

```typescript
import { renderWithProviders, screen } from '@/__tests__/helpers';
import { HomePage } from '@/modules/home/pages/HomePage';

describe('HomePage', () => {
  it('should render page content', () => {
    renderWithProviders(<HomePage />, { initialEntries: ['/'] });
    expect(screen.getByRole('main')).toBeInTheDocument();
  });
});
```

### Routing Testing

Test navigation and route guards:

```typescript
import { renderWithProviders } from '@/__tests__/helpers';
import { useNavigate } from 'react-router-dom';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

describe('Navigation', () => {
  it('should navigate on button click', async () => {
    const navigate = jest.fn();
    (useNavigate as jest.Mock).mockReturnValue(navigate);
    
    renderWithProviders(<MyComponent />);
    await user.click(screen.getByRole('button'));
    expect(navigate).toHaveBeenCalledWith('/target');
  });
});
```

## Coverage Requirements

### Target Coverage: 95%

The project requires **95% code coverage** across:
- **Statements**: 95%
- **Branches**: 95%
- **Functions**: 95%
- **Lines**: 95%

### Excluded from Coverage

The following are excluded from coverage requirements:
- `index.ts` barrel export files
- `routes.tsx` route configuration files
- `main.tsx` entry point
- Type definition files (`.d.ts`)
- Enum files
- Story files (`.stories.tsx`)

### Coverage Strategy

1. **Unit Tests**: Test individual components, hooks, and utilities in isolation
2. **Integration Tests**: Test component interactions and data flow
3. **Edge Cases**: Test null, undefined, empty arrays, error states
4. **User Interactions**: Test clicks, inputs, form submissions, navigation
5. **Error Paths**: Test error handling and validation failures

## Best Practices

### 1. Test Isolation

Each test must be independent:
- Use `beforeEach` for setup, not shared state
- Clear mocks between tests: `jest.clearAllMocks()`
- Reset QueryClient between tests

```typescript
describe('MyComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render', () => {
    // Test implementation
  });
});
```

### 2. AAA Pattern

Follow Arrange-Act-Assert:

```typescript
it('should do something', () => {
  // Arrange
  const props = createButtonProps({ variant: 'primary' });
  
  // Act
  renderWithProviders(<Button {...props} />);
  
  // Assert
  expect(screen.getByRole('button')).toHaveClass('bg-blue');
});
```

### 3. Descriptive Test Names

Use clear, descriptive names:
- ✅ `should render button with primary variant`
- ✅ `should call onSubmit when form is valid`
- ❌ `works`
- ❌ `test button`

### 4. Avoid Test Duplication

- Use factories and fixtures to reduce duplication
- Extract common test logic into utility functions
- Use `describe` blocks to group related tests

```typescript
describe('Button variants', () => {
  it.each([
    ['primary', 'bg-blue-600'],
    ['secondary', 'bg-gray-600'],
    ['outline', 'border-gray-600'],
  ])('should render %s variant with correct class', (variant, expectedClass) => {
    const props = createButtonProps({ variant });
    renderWithProviders(<Button {...props} />);
    expect(screen.getByRole('button')).toHaveClass(expectedClass);
  });
});
```

### 5. Mock External Dependencies

Mock all external dependencies:
- API calls
- Browser APIs (localStorage, window.location)
- Third-party libraries
- React Router hooks

```typescript
jest.mock('@/api/documents', () => ({
  fetchDocuments: jest.fn().mockResolvedValue([]),
}));
```

### 6. Test User Behavior

Test what users see and do, not implementation details:
- ✅ Test that a button is disabled when loading
- ❌ Test that `isLoading` state is `true`

### 7. Async Testing

Always await async operations:

```typescript
it('should load data', async () => {
  renderWithProviders(<DataComponent />);
  await waitFor(() => {
    expect(screen.getByText('Data loaded')).toBeInTheDocument();
  });
});
```

## Common Testing Scenarios

### Testing Forms

```typescript
import { fillTextField, submitForm, assertFieldError } from '@/__tests__/helpers';

it('should submit form with valid data', async () => {
  const onSubmit = jest.fn();
  
  renderWithProviders(<Form onSubmit={onSubmit} />);
  
  await fillTextField('Email', 'test@example.com');
  await fillTextField('Password', 'password123');
  await submitForm('Submit');
  
  await waitFor(() => {
    expect(onSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });
});
```

### Testing Modals

```typescript
import { createModalProps } from '@/__tests__/helpers';

it('should close modal when close button is clicked', async () => {
  const user = userEvent.setup();
  const onClose = jest.fn();
  const props = createModalProps({ isOpen: true, onClose });
  
  renderWithProviders(<Modal {...props} />);
  
  await user.click(screen.getByRole('button', { name: /close/i }));
  expect(onClose).toHaveBeenCalled();
});
```

### Testing React Query Hooks

```typescript
import { renderQueryHook, assertQuerySuccess } from '@/__tests__/helpers';

it('should fetch data on mount', async () => {
  const mockFetch = jest.fn().mockResolvedValue({ data: 'test' });
  jest.spyOn(api, 'fetchData').mockImplementation(mockFetch);
  
  const { result } = renderQueryHook(() => useDataQuery());
  
  await waitFor(() => {
    assertQuerySuccess(result.current);
  });
  
  expect(result.current.data).toEqual({ data: 'test' });
});
```

### Testing Error States

```typescript
import { assertQueryError } from '@/__tests__/helpers';

it('should display error message when fetch fails', async () => {
  jest.spyOn(api, 'fetchData').mockRejectedValue(new Error('Failed'));
  
  const { result } = renderQueryHook(() => useDataQuery());
  
  await waitFor(() => {
    assertQueryError(result.current, 'Failed');
  });
});
```

## Debugging Tests

### View Rendered Output

```typescript
const { container } = renderWithProviders(<MyComponent />);
console.log(container.innerHTML);
```

### Debug Queries

```typescript
import { screen, logRoles } from '@testing-library/react';

renderWithProviders(<MyComponent />);
logRoles(screen.getByTestId('container'));
```

### Enable Verbose Logging

```bash
npm run test:unit -- --verbose
```

## CI/CD Integration

Tests run automatically in CI/CD pipeline:
- All tests must pass before merge
- Coverage must be at least 95%
- Tests run on every commit and PR

## Troubleshooting

### Common Issues

1. **"No tests found"**: Ensure test files match pattern `*.test.{ts,tsx}`
2. **Module resolution errors**: Check `moduleNameMapper` in `jest.config.cjs`
3. **Router errors**: Ensure `renderWithProviders` includes Router wrapper
4. **React Query errors**: Ensure QueryClient is provided in wrapper
5. **Path resolution errors**: Check `tsconfig.jest.json` paths configuration

### Getting Help

- Check existing test files for examples
- Review this documentation
- Consult React Testing Library docs: https://testing-library.com/react
- Check helper function TSDoc comments
