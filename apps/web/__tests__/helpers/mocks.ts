/**
 * @fileoverview Test Mocks - Reusable mock implementations for web app tests
 * @summary Shared mock objects and factories for apps/web tests
 * @description Provides mock implementations of React Router, React Query, and other dependencies
 * to avoid code duplication across test files.
 */

import type { ReactElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import type { RenderOptions } from '@testing-library/react';
import { render } from '@testing-library/react';

/**
 * @description Creates a new QueryClient with test-friendly defaults.
 * @param options Optional QueryClient options
 * @returns QueryClient instance configured for testing
 */
export function createTestQueryClient(options?: {
  defaultOptions?: {
    queries?: {
      retry?: boolean;
      cacheTime?: number;
    };
  };
}): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
        ...options?.defaultOptions?.queries,
      },
    },
    ...options,
  });
}

/**
 * @description Creates a wrapper component for React Query provider.
 * @param queryClient Optional QueryClient instance (creates new one if not provided)
 * @returns Wrapper component
 */
export function createQueryClientWrapper(queryClient?: QueryClient) {
  const client = queryClient || createTestQueryClient();
  return ({ children }: { children: React.ReactNode }): ReactElement => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

/**
 * @description Creates a wrapper component for React Router.
 * @param initialEntries Optional initial route entries (defaults to ['/'])
 * @returns Wrapper component
 */
export function createRouterWrapper(initialEntries: string[] = ['/']) {
  return ({ children }: { children: React.ReactNode }): ReactElement => (
    <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
  );
}

/**
 * @description Creates a combined wrapper with both QueryClient and Router.
 * @param options Optional configuration
 * @param options.queryClient Optional QueryClient instance
 * @param options.initialEntries Optional initial route entries
 * @returns Combined wrapper component
 */
export function createAppWrapper(options?: {
  queryClient?: QueryClient;
  initialEntries?: string[];
}) {
  const QueryWrapper = createQueryClientWrapper(options?.queryClient);
  const RouterWrapper = createRouterWrapper(options?.initialEntries);

  return ({ children }: { children: React.ReactNode }): ReactElement => (
    <QueryWrapper>
      <RouterWrapper>{children}</RouterWrapper>
    </QueryWrapper>
  );
}

/**
 * @description Custom render function with default providers.
 * @param ui Component to render
 * @param options Optional render options and wrapper configuration
 * @returns Render result with all testing utilities
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: RenderOptions & {
    queryClient?: QueryClient;
    initialEntries?: string[];
  }
) {
  const { queryClient, initialEntries, ...renderOptions } = options || {};
  const Wrapper = createAppWrapper({ queryClient, initialEntries });

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

/**
 * @description Mocks window.location for testing navigation.
 * @param url URL to mock
 */
export function mockWindowLocation(url: string): void {
  delete (window as any).location;
  (window as any).location = new URL(url);
}

/**
 * @description Mocks localStorage for testing.
 * @returns Object with getItem, setItem, removeItem, clear mocks
 */
export function createMockLocalStorage() {
  const storage: Record<string, string> = {};

  return {
    getItem: jest.fn((key: string) => storage[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      storage[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete storage[key];
    }),
    clear: jest.fn(() => {
      Object.keys(storage).forEach((key) => delete storage[key]);
    }),
    storage,
  };
}

/**
 * @description Mocks sessionStorage for testing.
 * @returns Object with getItem, setItem, removeItem, clear mocks
 */
export function createMockSessionStorage() {
  const storage: Record<string, string> = {};

  return {
    getItem: jest.fn((key: string) => storage[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      storage[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete storage[key];
    }),
    clear: jest.fn(() => {
      Object.keys(storage).forEach((key) => delete storage[key]);
    }),
    storage,
  };
}























