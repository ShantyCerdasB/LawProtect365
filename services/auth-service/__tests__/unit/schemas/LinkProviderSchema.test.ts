/**
 * @fileoverview LinkProviderSchema.test.ts - Unit tests for LinkProviderSchema
 * @summary Tests for LinkProvider request and response validation schemas
 * @description Tests validation schemas for provider linking including redirect, direct, and finalize modes.
 */

import { describe, it, expect } from '@jest/globals';
import { LinkProviderBodySchema, LinkProviderResponseSchema } from '../../../src/domain/schemas/LinkProviderSchema';
import { LinkingMode, OAuthProvider } from '../../../src/domain/enums';

describe('LinkProviderBodySchema', () => {
  describe('REDIRECT mode', () => {
    it('should validate redirect mode with successUrl and failureUrl', () => {
      const body = {
        mode: LinkingMode.REDIRECT,
        provider: OAuthProvider.GOOGLE,
        successUrl: 'https://example.com/success',
        failureUrl: 'https://example.com/failure'
      };

      const result = LinkProviderBodySchema.safeParse(body);

      expect(result.success).toBe(true);
    });

    it('should reject redirect mode without successUrl', () => {
      const body = {
        mode: LinkingMode.REDIRECT,
        provider: OAuthProvider.GOOGLE,
        failureUrl: 'https://example.com/failure'
      };

      const result = LinkProviderBodySchema.safeParse(body);

      expect(result.success).toBe(false);
    });

    it('should reject redirect mode without failureUrl', () => {
      const body = {
        mode: LinkingMode.REDIRECT,
        provider: OAuthProvider.GOOGLE,
        successUrl: 'https://example.com/success'
      };

      const result = LinkProviderBodySchema.safeParse(body);

      expect(result.success).toBe(false);
    });

    it('should reject redirect mode with invalid URLs', () => {
      const body = {
        mode: LinkingMode.REDIRECT,
        provider: OAuthProvider.GOOGLE,
        successUrl: 'not-a-url',
        failureUrl: 'https://example.com/failure'
      };

      const result = LinkProviderBodySchema.safeParse(body);

      expect(result.success).toBe(false);
    });
  });

  describe('DIRECT mode', () => {
    it('should validate direct mode with authorizationCode', () => {
      const body = {
        mode: LinkingMode.DIRECT,
        provider: OAuthProvider.MICROSOFT_365,
        authorizationCode: 'auth-code-123'
      };

      const result = LinkProviderBodySchema.safeParse(body);

      expect(result.success).toBe(true);
    });

    it('should validate direct mode with idToken', () => {
      const body = {
        mode: LinkingMode.DIRECT,
        provider: OAuthProvider.APPLE,
        idToken: 'id-token-123'
      };

      const result = LinkProviderBodySchema.safeParse(body);

      expect(result.success).toBe(true);
    });

    it('should validate direct mode with either authorizationCode or idToken', () => {
      const body = {
        mode: LinkingMode.DIRECT,
        provider: OAuthProvider.GOOGLE,
        authorizationCode: 'auth-code-123',
        idToken: 'id-token-123'
      };

      const result = LinkProviderBodySchema.safeParse(body);

      expect(result.success).toBe(true);
    });

    it('should reject direct mode without authorizationCode or idToken', () => {
      const body = {
        mode: LinkingMode.DIRECT,
        provider: OAuthProvider.GOOGLE
      };

      const result = LinkProviderBodySchema.safeParse(body);

      expect(result.success).toBe(false);
    });
  });

  describe('FINALIZE mode', () => {
    it('should validate finalize mode with authorizationCode', () => {
      const body = {
        mode: LinkingMode.FINALIZE,
        provider: OAuthProvider.GOOGLE,
        authorizationCode: 'auth-code-123',
        code: 'code-123',
        state: 'state-123'
      };

      const result = LinkProviderBodySchema.safeParse(body);

      expect(result.success).toBe(true);
    });

    it('should validate finalize mode with idToken', () => {
      const body = {
        mode: LinkingMode.FINALIZE,
        provider: OAuthProvider.APPLE,
        idToken: 'id-token-123',
        code: 'code-123',
        state: 'state-123'
      };

      const result = LinkProviderBodySchema.safeParse(body);

      expect(result.success).toBe(true);
    });

    it('should reject finalize mode without authorizationCode or idToken', () => {
      const body = {
        mode: LinkingMode.FINALIZE,
        provider: OAuthProvider.GOOGLE,
        code: 'code-123',
        state: 'state-123'
      };

      const result = LinkProviderBodySchema.safeParse(body);

      expect(result.success).toBe(false);
    });
  });

  describe('provider validation', () => {
    it('should validate all OAuth providers', () => {
      const providers = [OAuthProvider.GOOGLE, OAuthProvider.MICROSOFT_365, OAuthProvider.APPLE, OAuthProvider.COGNITO];

      providers.forEach(provider => {
        const body = {
          mode: LinkingMode.DIRECT,
          provider,
          authorizationCode: 'auth-code-123'
        };

        const result = LinkProviderBodySchema.safeParse(body);

        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid provider enum', () => {
      const body = {
        mode: LinkingMode.DIRECT,
        provider: 'INVALID_PROVIDER',
        authorizationCode: 'auth-code-123'
      };

      const result = LinkProviderBodySchema.safeParse(body);

      expect(result.success).toBe(false);
    });
  });
});

describe('LinkProviderResponseSchema', () => {
  it('should validate response with linkUrl', () => {
    const response = {
      linkUrl: 'https://example.com/oauth/authorize?client_id=123'
    };

    const result = LinkProviderResponseSchema.safeParse(response);

    expect(result.success).toBe(true);
  });

  it('should validate response with linked status', () => {
    const response = {
      linked: true,
      provider: OAuthProvider.GOOGLE,
      providerAccountId: 'provider-account-123',
      linkedAt: '2024-01-15T00:00:00Z'
    };

    const result = LinkProviderResponseSchema.safeParse(response);

    expect(result.success).toBe(true);
  });

  it('should validate minimal response', () => {
    const response = {
      linked: false
    };

    const result = LinkProviderResponseSchema.safeParse(response);

    expect(result.success).toBe(true);
  });

  it('should validate empty response', () => {
    const response = {};

    const result = LinkProviderResponseSchema.safeParse(response);

    expect(result.success).toBe(true);
  });

  it('should reject invalid URL format', () => {
    const response = {
      linkUrl: 'not-a-url'
    };

    const result = LinkProviderResponseSchema.safeParse(response);

    expect(result.success).toBe(false);
  });

  it('should reject invalid datetime format', () => {
    const response = {
      linked: true,
      linkedAt: 'invalid-date'
    };

    const result = LinkProviderResponseSchema.safeParse(response);

    expect(result.success).toBe(false);
  });

  it('should reject invalid provider enum', () => {
    const response = {
      linked: true,
      provider: 'INVALID_PROVIDER'
    };

    const result = LinkProviderResponseSchema.safeParse(response);

    expect(result.success).toBe(false);
  });
});









