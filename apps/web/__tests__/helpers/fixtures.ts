/**
 * @fileoverview Test Fixtures - Reusable test data for web app
 * @summary Shared test data objects for apps/web tests
 * @description Provides mock data objects (users, documents, routes, etc.)
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
 * @description Mock route paths for testing navigation
 */
export const mockRoutes = {
  home: '/',
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
  },
  documents: {
    list: '/documents',
    sign: '/documents/sign',
    view: '/documents/:id',
  },
  users: {
    list: '/users',
    profile: '/users/profile',
  },
} as const;

/**
 * @description Mock carousel slide data
 */
export const mockCarouselSlide = {
  imageSrc: '/test-image.jpg',
  imageAlt: 'Test image',
  title: 'Test Title',
  description: 'Test description',
  buttons: [
    {
      label: 'Learn more',
      variant: 'primary' as const,
      href: '/learn-more',
    },
  ],
} as const;

/**
 * @description Mock button props
 */
export const mockButtonProps = {
  variant: 'primary' as const,
  size: 'md' as const,
  children: 'Test Button',
  onClick: jest.fn(),
} as const;

/**
 * @description Mock modal props
 */
export const mockModalProps = {
  isOpen: true,
  onClose: jest.fn(),
  title: 'Test Modal',
  children: 'Test content',
} as const;

/**
 * @description Mock PDF file for testing
 */
export const mockPdfFile = new File(['pdf content'], 'test.pdf', {
  type: 'application/pdf',
});

/**
 * @description Mock image file for testing
 */
export const mockImageFile = new File(['image content'], 'test.jpg', {
  type: 'image/jpeg',
});

/**
 * @description Mock form data
 */
export const mockFormData = {
  email: 'test@example.com',
  password: 'password123',
  name: 'Test User',
  confirmPassword: 'password123',
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
 * @description Mock React Query query data
 */
export const createMockQueryData = <T>(data: T) => ({
  data,
  isLoading: false,
  isError: false,
  isSuccess: true,
  error: null,
  isFetching: false,
  refetch: jest.fn(),
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
  isFetching: true,
  refetch: jest.fn(),
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
  isFetching: false,
  refetch: jest.fn(),
} as const);

