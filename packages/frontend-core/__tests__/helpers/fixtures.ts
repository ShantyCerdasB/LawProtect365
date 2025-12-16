/**
 * @fileoverview Test Fixtures - Reusable test data
 * @summary Shared test data objects for frontend-core tests
 * @description Provides mock data objects (users, documents, API responses, etc.)
 * to avoid code duplication and ensure consistency across test files.
 */

/**
 * @description Mock user object for testing
 */
export const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  role: 'user',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
} as const;

/**
 * @description Mock authenticated user with token
 */
export const mockAuthenticatedUser = {
  ...mockUser,
  token: 'mock-jwt-token',
  refreshToken: 'mock-refresh-token',
  expiresAt: new Date(Date.now() + 3600000).toISOString(),
} as const;

/**
 * @description Mock document object for testing
 */
export const mockDocument = {
  id: 'doc-123',
  title: 'Test Document',
  type: 'contract',
  status: 'draft',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
} as const;

/**
 * @description Mock PDF source for document testing
 */
export const mockPdfSource = {
  url: 'https://example.com/document.pdf',
  pages: 5,
  width: 612,
  height: 792,
} as const;

/**
 * @description Mock signature placement data
 */
export const mockSignaturePlacement = {
  page: 1,
  x: 100,
  y: 200,
  width: 150,
  height: 50,
  signatureId: 'sig-123',
} as const;

/**
 * @description Mock text placement data
 */
export const mockTextPlacement = {
  page: 1,
  x: 100,
  y: 200,
  width: 200,
  height: 30,
  text: 'Test Text',
  fontSize: 12,
} as const;

/**
 * @description Mock date placement data
 */
export const mockDatePlacement = {
  page: 1,
  x: 100,
  y: 200,
  width: 150,
  height: 30,
  format: 'YYYY-MM-DD',
  fontSize: 12,
} as const;

/**
 * @description Mock API error response
 */
export const mockApiError = {
  message: 'Internal Server Error',
  code: 'INTERNAL_ERROR',
  status: 500,
} as const;

/**
 * @description Mock network context
 */
export const mockNetworkContext = {
  ip: '192.168.1.1',
  country: 'US',
  userAgent: 'Mozilla/5.0 (Test Browser)',
} as const;

/**
 * @description Mock HTTP response
 */
export const createMockHttpResponse = <T>(data: T, status: number = 200) => ({
  path: '/api/test',
  method: 'GET',
  status,
  data,
  headers: {},
} as const);

/**
 * @description Mock paginated response
 */
export const createMockPaginatedResponse = <T>(
  items: T[],
  page: number = 1,
  pageSize: number = 10
) => ({
  items,
  pagination: {
    page,
    pageSize,
    total: items.length,
    totalPages: Math.ceil(items.length / pageSize),
  },
} as const);

/**
 * @description Mock React Query query data
 */
export const createMockQueryData = <T>(data: T) => ({
  data,
  isLoading: false,
  isError: false,
  isSuccess: true,
  error: null,
} as const);

/**
 * @description Mock React Query loading state
 */
export const mockQueryLoading = {
  data: undefined,
  isLoading: true,
  isError: false,
  isSuccess: false,
  error: null,
} as const;

/**
 * @description Mock React Query error state
 */
export const createMockQueryError = (error: Error) => ({
  data: undefined,
  isLoading: false,
  isError: true,
  isSuccess: false,
  error,
} as const);

