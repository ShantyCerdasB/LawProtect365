# Unit Tests

This directory contains unit tests for the signature service. Unit tests focus on testing individual functions, classes, and modules in isolation without external dependencies.

## Test Structure

- **Pure Functions**: Test business logic functions with mocked inputs
- **Service Classes**: Test service classes with mocked dependencies
- **Utility Functions**: Test helper functions and utilities
- **Data Transformations**: Test data mapping and transformation logic

## Testing Guidelines

### What to Test
- Business logic functions
- Data validation and transformation
- Error handling and edge cases
- Service layer methods (with mocked dependencies)

### What NOT to Test
- External API calls (use integration tests)
- Database operations (use integration tests)
- File system operations (use integration tests)
- Third-party library functionality

### Mocking Strategy
- Mock all external dependencies
- Use Jest mocks for AWS SDK clients
- Mock file system operations
- Mock network requests

## Example Test Structure

```typescript
/**
 * @file example.test.ts
 * @summary Unit tests for example service
 * @description Tests the example service business logic with mocked dependencies
 */

import { ExampleService } from '@/services/exampleService';
import { mockDependency } from '../helpers/mocks';

describe('ExampleService', () => {
  let service: ExampleService;
  let mockDep: jest.Mocked<typeof mockDependency>;

  beforeEach(() => {
    mockDep = mockDependency();
    service = new ExampleService(mockDep);
  });

  describe('processData', () => {
    it('should process valid data correctly', () => {
      // Test implementation
    });

    it('should handle invalid data gracefully', () => {
      // Test implementation
    });
  });
});
```

## Running Unit Tests

```bash
# Run all unit tests
npm test -- __tests__/unit

# Run specific unit test file
npm test -- __tests__/unit/example.test.ts

# Run unit tests in watch mode
npm test -- __tests__/unit --watch
```
