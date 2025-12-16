/**
 * @fileoverview Router Mocks - Mock implementations for React Router
 * @summary Reusable mocks and utilities for testing React Router navigation
 * @description
 * Provides mock implementations and utilities for testing components that use
 * React Router, including navigation functions and route configuration.
 */

import type { NavigateFunction, Location } from 'react-router-dom';
import { createMockNavigate, createRouterConfig } from '../factories/routerFactories';

/**
 * @description Creates a mock useNavigate hook implementation.
 * @returns Mock navigate function and hook
 */
export function mockUseNavigate() {
  const navigate = createMockNavigate();
  return {
    navigate,
    mockHook: () => navigate,
  };
}

/**
 * @description Creates a mock useLocation hook implementation.
 * @param location Location object to return
 * @returns Mock location and hook
 */
export function mockUseLocation(location: Partial<Location> = {}) {
  const mockLocation: Location = {
    pathname: '/',
    search: '',
    hash: '',
    state: null,
    key: 'default',
    ...location,
  };

  return {
    location: mockLocation,
    mockHook: () => mockLocation,
  };
}

/**
 * @description Creates router configuration for testing.
 * @param path Initial path for the router
 * @returns Router configuration object
 */
export function mockRouter(path: string = '/') {
  return createRouterConfig(path);
}
