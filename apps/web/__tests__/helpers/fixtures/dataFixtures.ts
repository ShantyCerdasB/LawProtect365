/**
 * @fileoverview Data Fixtures - Reusable test data objects
 * @summary Pre-configured data objects for testing
 * @description
 * Provides pre-configured data objects for users, documents, API responses, etc.
 * These fixtures ensure consistency across test files and reduce duplication.
 */

/**
 * @description Mock user object for testing.
 */
export const userFixtures = {
  basic: {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    role: 'user',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },

  authenticated: {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    role: 'user',
    token: 'mock-jwt-token',
    refreshToken: 'mock-refresh-token',
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },

  admin: {
    id: 'admin-123',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'admin',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
} as const;

/**
 * @description Mock document object for testing.
 */
export const documentFixtures = {
  basic: {
    id: 'doc-123',
    name: 'Test Document',
    type: 'pdf',
    size: 1024,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },

  signed: {
    id: 'doc-123',
    name: 'Signed Document',
    type: 'pdf',
    size: 2048,
    signed: true,
    signedAt: '2024-01-02T00:00:00Z',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
  },
} as const;

/**
 * @description Mock file objects for testing file uploads.
 */
export const fileFixtures = {
  pdf: new File(['pdf content'], 'test.pdf', {
    type: 'application/pdf',
  }),

  image: new File(['image content'], 'test.jpg', {
    type: 'image/jpeg',
  }),

  large: new File(['large content'.repeat(1000)], 'large.pdf', {
    type: 'application/pdf',
  }),
} as const;

/**
 * @description Mock API response fixtures.
 */
export const apiResponseFixtures = {
  success: {
    success: true,
    data: null,
    message: 'Operation successful',
  },

  error: {
    success: false,
    error: {
      message: 'Internal Server Error',
      code: 'INTERNAL_ERROR',
      status: 500,
    },
  },

  validationError: {
    success: false,
    error: {
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      status: 400,
      details: [
        { field: 'email', message: 'Invalid email format' },
        { field: 'password', message: 'Password too short' },
      ],
    },
  },
} as const;
