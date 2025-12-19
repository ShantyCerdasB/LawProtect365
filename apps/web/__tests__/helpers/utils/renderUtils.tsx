/**
 * @fileoverview Render Utilities - Enhanced rendering utilities for tests
 * @summary Reusable render wrappers and utilities for component testing
 * @description
 * Provides enhanced render functions that automatically wrap components with
 * necessary providers (React Query, React Router, etc.) to reduce boilerplate
 * in test files.
 */

import React, { type ReactElement, type ReactNode } from 'react';
import type { RenderOptions, RenderResult } from '@testing-library/react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import { createTestQueryClient } from '../mocks/reactQueryMocks';
import i18n from 'i18next';

if (!i18n.isInitialized) {
  throw new Error('i18n must be initialized in setup.ts before renderUtils is used');
}

/**
 * @description Configuration options for renderWithProviders.
 */
export interface RenderWithProvidersOptions extends RenderOptions {
  queryClient?: QueryClient;
  initialEntries?: string[];
  initialIndex?: number;
}

/**
 * @description Renders a component with all necessary providers (React Query, Router).
 * @param ui Component to render
 * @param options Optional render and provider configuration options
 * @returns Render result with all testing utilities
 */
function createTestWrapper(
  queryClient: QueryClient,
  initialEntries: string[],
  initialIndex: number
) {
  return ({ children }: { children: ReactNode }): ReactElement => {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter
          initialEntries={initialEntries}
          initialIndex={initialIndex}
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <I18nextProvider i18n={i18n}>
            {children as any}
          </I18nextProvider>
        </MemoryRouter>
      </QueryClientProvider>
    );
  };
}

export function renderWithProviders(
  ui: React.ReactElement,
  options?: RenderWithProvidersOptions
): RenderResult {
  const {
    queryClient: providedQueryClient,
    initialEntries = ['/'],
    initialIndex = 0,
    ...renderOptions
  } = options || {};

  const queryClient = providedQueryClient || createTestQueryClient();
  const Wrapper = createTestWrapper(queryClient, initialEntries, initialIndex);

  return render(ui as any, { 
    wrapper: Wrapper as any, 
    ...renderOptions 
  });
}

/**
 * @description Creates a wrapper component with QueryClient provider only.
 * @param queryClient Optional QueryClient instance (creates new one if not provided)
 * @returns Wrapper component
 */
export function createQueryClientWrapper(queryClient?: QueryClient) {
  const client = queryClient || createTestQueryClient();
  return ({ children }: { children: ReactNode }): ReactElement => (
    <QueryClientProvider client={client}>{children as any}</QueryClientProvider>
  );
}

/**
 * @description Creates a wrapper component with Router provider only.
 * @param initialEntries Optional initial route entries (defaults to ['/'])
 * @param initialIndex Optional initial route index (defaults to 0)
 * @returns Wrapper component
 */
export function createRouterWrapper(
  initialEntries: string[] = ['/'],
  initialIndex: number = 0
) {
  return ({ children }: { children: ReactNode }): ReactElement => (
    <MemoryRouter initialEntries={initialEntries} initialIndex={initialIndex}>
      {children}
    </MemoryRouter>
  );
}

/**
 * @description Creates a combined wrapper with both QueryClient and Router.
 * @param options Optional configuration
 * @param options.queryClient Optional QueryClient instance
 * @param options.initialEntries Optional initial route entries
 * @param options.initialIndex Optional initial route index
 * @returns Combined wrapper component
 */
export function createAppWrapper(options?: {
  queryClient?: QueryClient;
  initialEntries?: string[];
  initialIndex?: number;
}) {
  const QueryWrapper = createQueryClientWrapper(options?.queryClient);
  const RouterWrapper = createRouterWrapper(
    options?.initialEntries,
    options?.initialIndex
  );

  return ({ children }: { children: ReactNode }): ReactElement => (
    <QueryWrapper>
      <RouterWrapper>{children}</RouterWrapper>
    </QueryWrapper>
  );
}

