# Coverage Guide

## Target: 95% Coverage

The `@lawprotect/web` application requires **95% code coverage** across all metrics:
- **Statements**: 95%
- **Branches**: 95%
- **Functions**: 95%
- **Lines**: 95%

## Generating Coverage Reports

```bash
# Generate coverage report
npm run test:unit:coverage

# View coverage report
# Coverage report is generated in coverage/ directory
# Open coverage/lcov-report/index.html in browser
```

## Files Excluded from Coverage

The following files are automatically excluded from coverage requirements:

### Configuration and Entry Points
- `src/main.tsx` - Application entry point
- `src/**/routes.tsx` - Route configuration files

### Barrel Exports
- `src/**/index.ts` - Barrel export files

### Type Definitions
- `src/**/*.d.ts` - Type definition files

### Enums
- `src/**/enums/**/*.ts` - Enumeration files

### Story Files
- `src/**/*.stories.{ts,tsx}` - Storybook story files

## Coverage Strategy

### 1. Unit Tests (Primary Focus)

Test individual components, hooks, and utilities in isolation:

```typescript
import { renderWithProviders } from '@/__tests__/helpers';

describe('MyComponent', () => {
  it('should render correctly', () => {
    renderWithProviders(<MyComponent />);
    // Assertions
  });

  it('should handle user interactions', async () => {
    // Test interactions
  });
});
```

**Target**: 100% coverage for:
- Component rendering
- Props handling
- Event handlers
- Conditional rendering
- Edge cases (null, undefined, empty states)

### 2. Integration Tests

Test component interactions and data flow:

```typescript
import { renderWithProviders, fillTextField, submitForm } from '@/__tests__/helpers';

describe('LoginForm', () => {
  it('should submit form with valid data', async () => {
    const onSubmit = jest.fn();
    renderWithProviders(<LoginForm onSubmit={onSubmit} />);
    
    await fillTextField('Email', 'test@example.com');
    await fillTextField('Password', 'password123');
    await submitForm('Login');
    
    expect(onSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });
});
```

**Target**: 95% coverage for:
- Form submissions
- Data flow between components
- Provider interactions (React Query, Router)
- State management

### 3. Hook Tests

Test custom hooks in isolation:

```typescript
import { renderHook } from '@testing-library/react';
import { createAppWrapper } from '@/__tests__/helpers';

describe('useMyHook', () => {
  it('should return initial state', () => {
    const wrapper = createAppWrapper();
    const { result } = renderHook(() => useMyHook(), { wrapper });
    expect(result.current.value).toBeDefined();
  });
});
```

**Target**: 100% coverage for:
- Hook initialization
- State updates
- Effect dependencies
- Cleanup functions
- Error handling

### 4. Utility Function Tests

Test utility functions with various inputs:

```typescript
describe('formatDate', () => {
  it('should format date correctly', () => {
    const date = new Date('2024-01-01');
    expect(formatDate(date)).toBe('01/01/2024');
  });

  it('should handle invalid dates', () => {
    expect(formatDate(null)).toBe('');
    expect(formatDate(undefined)).toBe('');
  });
});
```

**Target**: 100% coverage for:
- All code paths
- Edge cases
- Error handling
- Type guards

## Coverage by Component Type

### UI Components

**Target**: 95%+ coverage

Test:
- Rendering with all props
- Variant/styles
- Interactive states (hover, focus, disabled)
- User interactions (click, input, keyboard)
- Accessibility attributes

```typescript
describe('Button', () => {
  it('should render with all variants', () => {
    const variants = ['primary', 'secondary', 'outline'];
    variants.forEach((variant) => {
      const { unmount } = renderWithProviders(
        <Button variant={variant}>Click</Button>
      );
      expect(screen.getByRole('button')).toBeInTheDocument();
      unmount();
    });
  });
});
```

### Forms

**Target**: 95%+ coverage

Test:
- Field rendering
- Input validation
- Error messages
- Form submission
- Reset functionality
- Field dependencies

### Pages

**Target**: 90%+ coverage (lower due to routing complexity)

Test:
- Page rendering
- Data fetching
- Loading states
- Error states
- Navigation

### Hooks

**Target**: 100% coverage

Test:
- All code paths
- State updates
- Side effects
- Cleanup
- Dependencies

## Improving Coverage

### 1. Identify Uncovered Code

Run coverage report and identify:
- Uncovered lines (red)
- Partially covered branches (yellow)
- Uncovered functions

### 2. Write Missing Tests

For each uncovered section:
- Create test that exercises the code
- Test both happy path and error cases
- Test edge cases (null, undefined, empty)

### 3. Refactor for Testability

If code is hard to test:
- Extract complex logic into testable functions
- Split large components into smaller ones
- Use dependency injection for external dependencies

### 4. Use Test Utilities

Use helper functions to reduce boilerplate:
- Factories for props
- Fixtures for test data
- Utilities for common patterns

## Coverage Checklist

When writing tests, ensure:

- [ ] All branches are tested (if/else, switch cases)
- [ ] All functions are called
- [ ] All lines are executed
- [ ] Edge cases are covered (null, undefined, empty)
- [ ] Error paths are tested
- [ ] User interactions are tested
- [ ] Async operations are tested
- [ ] Props variations are tested
- [ ] State changes are tested

## Continuous Improvement

1. **Regular Coverage Reviews**: Review coverage reports weekly
2. **Coverage Thresholds**: Maintain minimum 95% coverage
3. **Coverage Alerts**: Set up CI/CD to fail on coverage below 95%
4. **Coverage Tracking**: Track coverage trends over time

## Coverage Report Interpretation

### Statement Coverage
Percentage of statements executed. Target: 95%

### Branch Coverage
Percentage of branches executed (if/else paths). Target: 95%

### Function Coverage
Percentage of functions called. Target: 95%

### Line Coverage
Percentage of lines executed. Target: 95%

## Common Coverage Issues

### Issue: Low Branch Coverage

**Solution**: Test all conditional paths

```typescript
it('should handle both success and error cases', async () => {
  // Test success case
  jest.spyOn(api, 'fetch').mockResolvedValue(data);
  renderWithProviders(<Component />);
  await waitFor(() => {
    expect(screen.getByText('Success')).toBeInTheDocument();
  });

  // Test error case
  jest.spyOn(api, 'fetch').mockRejectedValue(new Error('Failed'));
  renderWithProviders(<Component />);
  await waitFor(() => {
    expect(screen.getByText('Error')).toBeInTheDocument();
  });
});
```

### Issue: Untested Utility Functions

**Solution**: Create dedicated test files

```typescript
describe('utilityFunction', () => {
  it('should handle normal input', () => {
    expect(utilityFunction('input')).toBe('expected');
  });

  it('should handle edge cases', () => {
    expect(utilityFunction(null)).toBe(null);
    expect(utilityFunction(undefined)).toBe(undefined);
    expect(utilityFunction('')).toBe('');
  });
});
```

### Issue: Untested Error Handling

**Solution**: Test error scenarios

```typescript
it('should handle errors gracefully', () => {
  const consoleError = jest.spyOn(console, 'error').mockImplementation();
  
  renderWithProviders(<ComponentThatThrows />);
  
  expect(consoleError).toHaveBeenCalled();
  consoleError.mockRestore();
});
```

