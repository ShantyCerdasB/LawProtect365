# Test Helpers Organization

## Structure Overview

```
__tests__/helpers/
├── README.md                           # This file
├── testUtils.ts                        # General test utilities (UUIDs, etc.)
├── mocks/                              # Mock-related helpers
│   ├── prisma.ts                       # Prisma client mocks
│   ├── cursorPagination.ts             # Cursor pagination mocks
│   └── repository.ts                   # Repository method mocks
├── builders/                           # Test data builders
│   ├── consent.ts                      # Consent-specific builders
│   └── index.ts                        # Export all builders
└── scenarios/                          # Common test scenarios
    ├── cursorPagination.ts             # Cursor pagination scenarios
    └── index.ts                        # Export all scenarios
```

## Single Responsibility Principle

Each helper file has a single, well-defined responsibility:

- **mocks/**: Mock external dependencies (Prisma, shared-ts, etc.)
- **builders/**: Create test data (entities, DTOs, specs)
- **scenarios/**: Common test patterns and scenarios
- **testUtils.ts**: General utilities (UUIDs, dates, etc.)

## Usage Examples

### Using Mocks
```typescript
import { setupCursorPaginationMocks } from '../helpers/mocks/cursorPagination';
import { createPrismaMock } from '../helpers/mocks/prisma';
```

### Using Builders
```typescript
import { consentEntity, consentPersistenceRow } from '../helpers/builders/consent';
```

### Using Scenarios
```typescript
import { CursorPaginationScenarios } from '../helpers/scenarios/cursorPagination';
```
