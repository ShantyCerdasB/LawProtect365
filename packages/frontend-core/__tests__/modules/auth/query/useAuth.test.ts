/**
 * @fileoverview useAuth Hook Tests - Ensures useAuth configures queries and mutations
 * @summary Tests for modules/auth/query/useAuth.ts
 */

import { useAuth } from '../../../../src/modules/auth/query/useAuth';
import { createMockHttpClient, createMockStoragePort } from '../../../helpers/mocks';
import type { HttpClient } from '../../../../src/foundation/http/httpClient';

describe('useAuth hook', () => {
  let mockClient: jest.Mocked<HttpClient>;

  beforeEach(() => {
    mockClient = createMockHttpClient();
  });

  it('creates query and mutation helpers for authenticated user', async () => {
    const storage = createMockStoragePort();
    await storage.set('auth_token', 'token-123');

    const hookResult = useAuth({
      httpClient: mockClient,
      storage,
      tokenKey: 'auth_token',
    });

    expect(hookResult).toBeDefined();
    expect(typeof hookResult.updateUser).toBe('function');
    expect(hookResult.user).toBeUndefined();
  });

  it('calls underlying HttpClient when updateUser is invoked', async () => {
    const storage = createMockStoragePort();
    await storage.set('auth_token', 'token-123');

    const hookResult = useAuth({
      httpClient: mockClient,
      storage,
      tokenKey: 'auth_token',
    });

    hookResult.updateUser({ name: 'Updated' });

    expect(mockClient.post).toHaveBeenCalled();
  });
});


