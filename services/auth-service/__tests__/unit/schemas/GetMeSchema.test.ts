/**
 * @fileoverview GetMeSchema.test.ts - Unit tests for GetMeSchema
 * @summary Tests for GetMe query and response validation schemas
 * @description Tests validation schemas for GET /me endpoint including query parameters and response structure.
 */

import { describe, it, expect } from '@jest/globals';
import { GetMeQuerySchema, GetMeResponseSchema } from '../../../src/domain/schemas/GetMeSchema';
import { UserRole, UserAccountStatus, OAuthProvider, IncludeFlag } from '../../../src/domain/enums';

describe('GetMeQuerySchema', () => {
  it('should validate empty query', () => {
    const result = GetMeQuerySchema.safeParse({});

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.include).toBe('');
    }
  });

  it('should validate query with single include flag', () => {
    const result = GetMeQuerySchema.safeParse({ include: 'idp' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.include).toBe('idp');
    }
  });

  it('should validate query with multiple include flags', () => {
    const result = GetMeQuerySchema.safeParse({ include: 'idp,profile,claims' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.include).toBe('idp,profile,claims');
    }
  });

  it('should validate query with two include flags', () => {
    const result = GetMeQuerySchema.safeParse({ include: 'idp,profile' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.include).toBe('idp,profile');
    }
  });

  it('should reject invalid include flag', () => {
    const result = GetMeQuerySchema.safeParse({ include: 'invalid' });

    expect(result.success).toBe(false);
  });

  it('should reject invalid include flags combination', () => {
    const result = GetMeQuerySchema.safeParse({ include: 'idp,invalid,claims' });

    expect(result.success).toBe(false);
  });

  it('should transform undefined include to empty string', () => {
    const result = GetMeQuerySchema.safeParse({ include: undefined });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.include).toBe('');
    }
  });
});

describe('GetMeResponseSchema', () => {
  const baseResponse = {
    user: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'test@example.com',
      name: 'John Doe',
      givenName: 'John',
      lastName: 'Doe',
      role: UserRole.CUSTOMER,
      status: UserAccountStatus.ACTIVE,
      mfa: {
        required: false,
        enabled: false
      },
      identity: {
        cognitoSub: 'cognito-sub-123'
      },
      meta: {
        lastLoginAt: '2024-01-15T00:00:00Z',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      }
    }
  };

  it('should validate minimal response', () => {
    const result = GetMeResponseSchema.safeParse(baseResponse);

    expect(result.success).toBe(true);
  });

  it('should validate response with providers', () => {
    const response = {
      ...baseResponse,
      user: {
        ...baseResponse.user,
        providers: [
          {
            provider: OAuthProvider.GOOGLE,
            linkedAt: '2024-01-10T00:00:00Z'
          }
        ]
      }
    };

    const result = GetMeResponseSchema.safeParse(response);

    expect(result.success).toBe(true);
  });

  it('should validate response with personalInfo', () => {
    const response = {
      ...baseResponse,
      user: {
        ...baseResponse.user,
        personalInfo: {
          phone: '+1234567890',
          locale: 'en-US',
          timeZone: 'America/New_York'
        }
      }
    };

    const result = GetMeResponseSchema.safeParse(response);

    expect(result.success).toBe(true);
  });

  it('should validate response with claims', () => {
    const response = {
      ...baseResponse,
      user: {
        ...baseResponse.user,
        claims: {
          role: 'CUSTOMER',
          account_status: 'ACTIVE',
          is_mfa_required: false,
          mfa_enabled: false,
          user_id: '123e4567-e89b-12d3-a456-426614174000'
        }
      }
    };

    const result = GetMeResponseSchema.safeParse(response);

    expect(result.success).toBe(true);
  });

  it('should validate response with all optional fields', () => {
    const response = {
      ...baseResponse,
      user: {
        ...baseResponse.user,
        providers: [
          {
            provider: OAuthProvider.GOOGLE,
            linkedAt: '2024-01-10T00:00:00Z'
          },
          {
            provider: OAuthProvider.MICROSOFT_365,
            linkedAt: '2024-01-12T00:00:00Z'
          }
        ],
        personalInfo: {
          phone: '+1234567890',
          locale: 'en-US',
          timeZone: 'America/New_York'
        },
        claims: {
          role: 'CUSTOMER',
          account_status: 'ACTIVE',
          is_mfa_required: false,
          mfa_enabled: false,
          user_id: '123e4567-e89b-12d3-a456-426614174000'
        }
      },
      headers: {
        'x-request-id': 'req-123'
      }
    };

    const result = GetMeResponseSchema.safeParse(response);

    expect(result.success).toBe(true);
  });

  it('should reject invalid user ID format', () => {
    const response = {
      ...baseResponse,
      user: {
        ...baseResponse.user,
        id: 'invalid-uuid'
      }
    };

    const result = GetMeResponseSchema.safeParse(response);

    expect(result.success).toBe(false);
  });

  it('should reject invalid email format', () => {
    const response = {
      ...baseResponse,
      user: {
        ...baseResponse.user,
        email: 'not-an-email'
      }
    };

    const result = GetMeResponseSchema.safeParse(response);

    expect(result.success).toBe(false);
  });

  it('should reject invalid role enum', () => {
    const response = {
      ...baseResponse,
      user: {
        ...baseResponse.user,
        role: 'INVALID_ROLE'
      }
    };

    const result = GetMeResponseSchema.safeParse(response);

    expect(result.success).toBe(false);
  });

  it('should reject invalid status enum', () => {
    const response = {
      ...baseResponse,
      user: {
        ...baseResponse.user,
        status: 'INVALID_STATUS'
      }
    };

    const result = GetMeResponseSchema.safeParse(response);

    expect(result.success).toBe(false);
  });

  it('should reject invalid datetime format', () => {
    const response = {
      ...baseResponse,
      user: {
        ...baseResponse.user,
        meta: {
          ...baseResponse.user.meta,
          createdAt: 'invalid-date'
        }
      }
    };

    const result = GetMeResponseSchema.safeParse(response);

    expect(result.success).toBe(false);
  });

  it('should accept null givenName and lastName', () => {
    const response = {
      ...baseResponse,
      user: {
        ...baseResponse.user,
        givenName: null,
        lastName: null
      }
    };

    const result = GetMeResponseSchema.safeParse(response);

    expect(result.success).toBe(true);
  });

  it('should accept null lastLoginAt', () => {
    const response = {
      ...baseResponse,
      user: {
        ...baseResponse.user,
        meta: {
          ...baseResponse.user.meta,
          lastLoginAt: null
        }
      }
    };

    const result = GetMeResponseSchema.safeParse(response);

    expect(result.success).toBe(true);
  });

  it('should accept null values in personalInfo', () => {
    const response = {
      ...baseResponse,
      user: {
        ...baseResponse.user,
        personalInfo: {
          phone: null,
          locale: null,
          timeZone: null
        }
      }
    };

    const result = GetMeResponseSchema.safeParse(response);

    expect(result.success).toBe(true);
  });
});
