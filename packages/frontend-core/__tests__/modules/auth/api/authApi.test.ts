/**
 * @fileoverview Auth API Tests - Unit tests for authentication API functions
 * @summary Tests for auth module API client functions
 */

import {
  getMe,
  patchMe,
  linkProvider,
  unlinkProvider,
  getUsers,
  getUserById,
  setUserRole,
  setUserStatus,
} from '../../../../src/modules/auth/api/authApi';
import { createMockHttpClient } from '../../../helpers/mocks';
import { assertHttpClientCall } from '../../../helpers/test-helpers';
import type { HttpClient } from '../../../../src/foundation/http/httpClient';

describe('authApi', () => {
  let mockClient: jest.Mocked<HttpClient>;

  beforeEach(() => {
    mockClient = createMockHttpClient();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getMe', () => {
    it('should call client.get with /me path', async () => {
      mockClient.get.mockResolvedValue({ id: '1', name: 'Test User' });

      await getMe(mockClient);

      assertHttpClientCall(mockClient, 'get', '/me');
    });

    it('should include query parameters when provided', async () => {
      mockClient.get.mockResolvedValue({ id: '1', name: 'Test User' });

      await getMe(mockClient, { include: 'oauth,personal' });

      expect(mockClient.get).toHaveBeenCalledWith('/me?include=oauth,personal', undefined);
    });

    it('should pass Zod schema when provided', async () => {
      const { z } = await import('zod');
      const schema = z.object({ id: z.string(), name: z.string() });
      mockClient.get.mockResolvedValue({ id: '1', name: 'Test User' });

      await getMe(mockClient, undefined, schema);

      expect(mockClient.get).toHaveBeenCalledWith('/me', schema);
    });
  });

  describe('patchMe', () => {
    it('should call client.post with /me path and body', async () => {
      const body = { name: 'Updated Name' };
      mockClient.post.mockResolvedValue({ id: '1', name: 'Updated Name' });

      await patchMe(mockClient, body);

      assertHttpClientCall(mockClient, 'post', '/me', body);
    });

    it('should pass Zod schema when provided', async () => {
      const { z } = await import('zod');
      const schema = z.object({ id: z.string(), name: z.string() });
      const body = { name: 'Updated Name' };
      mockClient.post.mockResolvedValue({ id: '1', name: 'Updated Name' });

      await patchMe(mockClient, body, schema);

      expect(mockClient.post).toHaveBeenCalledWith('/me', body, schema);
    });
  });

  describe('linkProvider', () => {
    it('should call client.post with /me/providers:link path and body', async () => {
      const body = { provider: 'google', code: 'auth-code' };
      mockClient.post.mockResolvedValue({ success: true });

      await linkProvider(mockClient, body);

      assertHttpClientCall(mockClient, 'post', '/me/providers:link', body);
    });
  });

  describe('unlinkProvider', () => {
    it('should call client.post with /me/providers:unlink path and body', async () => {
      const body = { provider: 'google', providerAccountId: 'acc-123' };
      mockClient.post.mockResolvedValue({ success: true });

      await unlinkProvider(mockClient, body);

      assertHttpClientCall(mockClient, 'post', '/me/providers:unlink', body);
    });
  });

  describe('getUsers', () => {
    it('should call client.get with /admin/users and all query parameters', async () => {
      mockClient.get.mockResolvedValue({ items: [], total: 0 });

      await getUsers(mockClient, {
        include: 'roles,permissions',
        status: 'active',
        role: 'admin',
        search: 'john',
        page: 2,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      assertHttpClientCall(
        mockClient,
        'get',
        '/admin/users?include=roles%2Cpermissions&status=active&role=admin&search=john&page=2&limit=20&sortBy=createdAt&sortOrder=desc'
      );
    });
  });

  describe('getUserById', () => {
    it('should call client.get with user id and optional include', async () => {
      mockClient.get.mockResolvedValue({ id: 'user-1' });

      await getUserById(mockClient, 'user-1', { include: 'roles' });

      assertHttpClientCall(mockClient, 'get', '/admin/users/user-1?include=roles');
    });
  });

  describe('setUserRole', () => {
    it('should call client.post with /admin/users/:id/role path and body', async () => {
      const body = { role: 'manager' };
      mockClient.post.mockResolvedValue({ id: 'user-1', role: 'manager' });

      await setUserRole(mockClient, 'user-1', body);

      assertHttpClientCall(mockClient, 'post', '/admin/users/user-1/role', body);
    });
  });

  describe('setUserStatus', () => {
    it('should call client.post with /admin/users/:id/status path and body', async () => {
      const body = { status: 'disabled' };
      mockClient.post.mockResolvedValue({ id: 'user-1', status: 'disabled' });

      await setUserStatus(mockClient, 'user-1', body);

      assertHttpClientCall(mockClient, 'post', '/admin/users/user-1/status', body);
    });
  });
});

