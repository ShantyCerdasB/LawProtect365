// @ts-nocheck
/**
 * @fileoverview Router Component Tests
 * @summary Tests for the AppRouter component
 */

/// <reference types="@testing-library/jest-dom" />
import React from 'react';
import { describe, it, expect, jest } from '@jest/globals';
import { screen, render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createTestQueryClient } from '@/__tests__/helpers/mocks/reactQueryMocks';
import { AppRouter } from '@/app/routing/router';

jest.mock('@/modules/home/routes', () => ({
  homeRoutes: jest.fn(() => [
    {
      path: '/',
      element: <div>Home Page</div>,
    },
  ]),
}));

jest.mock('@/modules/auth/routes', () => ({
  authRoutes: jest.fn(() => [
    {
      path: '/auth/login',
      element: <div>Login Page</div>,
    },
  ]),
}));

jest.mock('@/modules/admin/routes', () => ({
  adminRoutes: jest.fn(() => []),
}));

jest.mock('@/modules/documents/routes', () => ({
  documentsRoutes: jest.fn(() => []),
}));

jest.mock('@/app/layout/AppLayout', () => {
  const React = require('react');
  const { Outlet } = require('react-router-dom');
  return {
    AppLayout: () => (
      <div data-testid="app-layout">
        <Outlet />
      </div>
    ),
  };
});

describe('AppRouter', () => {
  const queryClient = createTestQueryClient();

  function TestWrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  }

  it('should render router provider', () => {
    render(<AppRouter />, { wrapper: TestWrapper });
    
    expect(screen.getByTestId('app-layout')).toBeInTheDocument();
  });

  it('should render home route at root path', async () => {
    render(<AppRouter />, { wrapper: TestWrapper });
    
    await new Promise(resolve => setTimeout(resolve, 100));
    const layout = screen.getByTestId('app-layout');
    expect(layout).toBeInTheDocument();
    expect(layout.textContent).toContain('Home Page');
  });

  it('should compose routes from modules', async () => {
    const { container } = render(<AppRouter />, { wrapper: TestWrapper });
    
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(screen.getByTestId('app-layout')).toBeInTheDocument();
    const layout = screen.getByTestId('app-layout');
    expect(layout.textContent).toContain('Home Page');
  });
});


