/**
 * @fileoverview useSignatureHttpClient Hook Tests - Unit tests for signature HTTP client hook
 * @summary Tests for useSignatureHttpClient.ts module
 * @jest-environment jsdom
 */

import { renderHook } from '@testing-library/react-hooks';
import { useSignatureHttpClient } from '../../../../src/modules/signature/hooks/useSignatureHttpClient';
import { createInterceptedHttpClient } from '../../../../src/foundation/http/createInterceptedHttpClient';
import { createMockStoragePort } from '../../../helpers/mocks';

jest.mock('../../../../src/foundation/http/createInterceptedHttpClient');
jest.mock('../../../../src/foundation/config/env', () => ({
  env: {
    signatureApiBaseUrl: 'https://signature-api.test.com',
  },
}));

describe('useSignatureHttpClient', () => {
  const mockFetch = jest.fn();
  const mockStorage = createMockStoragePort();

  beforeEach(() => {
    jest.clearAllMocks();
    (createInterceptedHttpClient as jest.Mock).mockReturnValue({
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
    });
  });

  it('should create intercepted HTTP client with signature API base URL', () => {
    const { result } = renderHook(() =>
      useSignatureHttpClient({
        fetchImpl: mockFetch,
        storage: mockStorage,
      })
    );

    expect(createInterceptedHttpClient).toHaveBeenCalledWith(
      expect.objectContaining({
        baseUrl: 'https://signature-api.test.com',
        fetchImpl: expect.any(Function),
        getAuthToken: expect.any(Function),
      })
    );
    expect(result.current).toBeDefined();
  });

  it('should use custom baseUrl when provided', () => {
    const customBaseUrl = 'https://custom-signature-api.test.com';

    renderHook(() =>
      useSignatureHttpClient({
        fetchImpl: mockFetch,
        storage: mockStorage,
        baseUrl: customBaseUrl,
      })
    );

    expect(createInterceptedHttpClient).toHaveBeenCalledWith(
      expect.objectContaining({
        baseUrl: customBaseUrl,
      })
    );
  });

  it('should wrap fetch to fix "Illegal invocation" error (lines 59-61)', () => {
    renderHook(() =>
      useSignatureHttpClient({
        fetchImpl: mockFetch,
        storage: mockStorage,
      })
    );

    const callArgs = (createInterceptedHttpClient as jest.Mock).mock.calls[0][0];
    const wrappedFetch = callArgs.fetchImpl;

    expect(typeof wrappedFetch).toBe('function');
    expect(wrappedFetch).not.toBe(mockFetch);

    wrappedFetch('https://test.com', { method: 'GET' });
    expect(mockFetch).toHaveBeenCalledWith('https://test.com', { method: 'GET' });
  });

  it('should get auth token from storage (lines 66-68)', async () => {
    await mockStorage.set('auth_token', 'test-token-123');

    renderHook(() =>
      useSignatureHttpClient({
        fetchImpl: mockFetch,
        storage: mockStorage,
        tokenKey: 'auth_token',
      })
    );

    const callArgs = (createInterceptedHttpClient as jest.Mock).mock.calls[0][0];
    const getAuthToken = callArgs.getAuthToken;

    const token = await getAuthToken();
    expect(token).toBe('test-token-123');
  });

  it('should use custom tokenKey when provided', async () => {
    await mockStorage.set('custom_token', 'custom-token-123');

    renderHook(() =>
      useSignatureHttpClient({
        fetchImpl: mockFetch,
        storage: mockStorage,
        tokenKey: 'custom_token',
      })
    );

    const callArgs = (createInterceptedHttpClient as jest.Mock).mock.calls[0][0];
    const getAuthToken = callArgs.getAuthToken;

    const token = await getAuthToken();
    expect(token).toBe('custom-token-123');
  });

  it('should use default tokenKey when not provided', async () => {
    await mockStorage.set('auth_token', 'default-token-123');

    renderHook(() =>
      useSignatureHttpClient({
        fetchImpl: mockFetch,
        storage: mockStorage,
      })
    );

    const callArgs = (createInterceptedHttpClient as jest.Mock).mock.calls[0][0];
    const getAuthToken = callArgs.getAuthToken;

    const token = await getAuthToken();
    expect(token).toBe('default-token-123');
  });

  it('should return null when token is not found', async () => {
    await mockStorage.remove('auth_token');

    renderHook(() =>
      useSignatureHttpClient({
        fetchImpl: mockFetch,
        storage: mockStorage,
      })
    );

    const callArgs = (createInterceptedHttpClient as jest.Mock).mock.calls[0][0];
    const getAuthToken = callArgs.getAuthToken;

    const token = await getAuthToken();
    expect(token).toBeNull();
  });
});
