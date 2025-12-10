/**
 * @fileoverview Auth API - HTTP client functions for authentication endpoints
 * @summary API functions for auth-service endpoints
 * @description Provides typed HTTP functions for user authentication, profile management, and OAuth provider linking.
 */

import type { HttpClient } from '../../../foundation/http/httpClient';
import type { ZodSchema } from 'zod';

/**
 * @description Retrieves the authenticated user's profile with optional data inclusion.
 * @param client HTTP client instance
 * @param params Query parameters for conditional data inclusion
 * @param schema Optional Zod schema to validate the response
 * @returns User profile with optional included data
 */
export function getMe<T = unknown>(
  client: HttpClient,
  params?: { include?: string },
  schema?: ZodSchema<T>
): Promise<T> {
  const query = params?.include ? `?include=${params.include}` : '';
  return client.get<T>(`/me${query}`, schema);
}

/**
 * @description Updates the authenticated user's profile.
 * @param client HTTP client instance
 * @param body Profile update data
 * @param schema Optional Zod schema to validate the response
 * @returns Updated user profile
 */
export function patchMe<T = unknown, B = unknown>(
  client: HttpClient,
  body: B,
  schema?: ZodSchema<T>
): Promise<T> {
  return client.post<T, B>(`/me`, body, schema);
}

/**
 * @description Links an OAuth provider to the authenticated user's account.
 * @param client HTTP client instance
 * @param body Provider linking data (mode, provider, URLs, tokens)
 * @param schema Optional Zod schema to validate the response
 * @returns Linking result with provider details
 */
export function linkProvider<T = unknown, B = unknown>(
  client: HttpClient,
  body: B,
  schema?: ZodSchema<T>
): Promise<T> {
  return client.post<T, B>(`/me/providers:link`, body, schema);
}

/**
 * @description Unlinks an OAuth provider from the authenticated user's account.
 * @param client HTTP client instance
 * @param body Provider unlinking data (provider, accountId, mode, token)
 * @param schema Optional Zod schema to validate the response
 * @returns Unlinking result with provider details
 */
export function unlinkProvider<T = unknown, B = unknown>(
  client: HttpClient,
  body: B,
  schema?: ZodSchema<T>
): Promise<T> {
  return client.post<T, B>(`/me/providers:unlink`, body, schema);
}

/**
 * @description Retrieves a list of users (admin only).
 * @param client HTTP client instance
 * @param params Query parameters for filtering, pagination, and sorting
 * @param schema Optional Zod schema to validate the response
 * @returns Paginated list of users
 */
export function getUsers<T = unknown>(
  client: HttpClient,
  params?: {
    include?: string;
    status?: string;
    role?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  },
  schema?: ZodSchema<T>
): Promise<T> {
  const queryParams = new URLSearchParams();
  if (params?.include) queryParams.append('include', params.include);
  if (params?.status) queryParams.append('status', params.status);
  if (params?.role) queryParams.append('role', params.role);
  if (params?.search) queryParams.append('search', params.search);
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
  if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);
  const query = queryParams.toString();
  return client.get<T>(`/admin/users${query ? `?${query}` : ''}`, schema);
}

/**
 * @description Retrieves a user by ID (admin only).
 * @param client HTTP client instance
 * @param userId User identifier
 * @param params Query parameters for conditional data inclusion
 * @param schema Optional Zod schema to validate the response
 * @returns User details with optional included data
 */
export function getUserById<T = unknown>(
  client: HttpClient,
  userId: string,
  params?: { include?: string },
  schema?: ZodSchema<T>
): Promise<T> {
  const query = params?.include ? `?include=${params.include}` : '';
  return client.get<T>(`/admin/users/${userId}${query}`, schema);
}

/**
 * @description Updates a user's role (admin only).
 * @param client HTTP client instance
 * @param userId User identifier
 * @param body Role update data
 * @param schema Optional Zod schema to validate the response
 * @returns Updated user with new role
 */
export function setUserRole<T = unknown, B = unknown>(
  client: HttpClient,
  userId: string,
  body: B,
  schema?: ZodSchema<T>
): Promise<T> {
  return client.post<T, B>(`/admin/users/${userId}/role`, body, schema);
}

/**
 * @description Updates a user's status (admin only).
 * @param client HTTP client instance
 * @param userId User identifier
 * @param body Status update data
 * @param schema Optional Zod schema to validate the response
 * @returns Updated user with new status
 */
export function setUserStatus<T = unknown, B = unknown>(
  client: HttpClient,
  userId: string,
  body: B,
  schema?: ZodSchema<T>
): Promise<T> {
  return client.post<T, B>(`/admin/users/${userId}/status`, body, schema);
}

