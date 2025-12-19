/**
 * @fileoverview UnlinkProviderSchema Tests - Unit tests for UnlinkProviderSchema
 * @summary Tests for UnlinkProvider request and response validation schemas
 * @description Tests validation schemas for provider unlinking including body and response validation.
 */

import { describe, it, expect } from '@jest/globals';
import { UnlinkProviderBodySchema, UnlinkProviderResponseSchema } from '../../../src/domain/schemas/UnlinkProviderSchema';
import { UnlinkingMode, OAuthProvider, ProviderUnlinkingStatus } from '../../../src/domain/enums';

describe('UnlinkProviderBodySchema', () => {
  it('should validate body with required fields', () => {
    const body = {
      mode: UnlinkingMode.DIRECT,
      provider: OAuthProvider.GOOGLE,
      providerAccountId: 'provider-account-123'
    };

    const result = UnlinkProviderBodySchema.safeParse(body);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.mode).toBe(UnlinkingMode.DIRECT);
      expect(result.data.provider).toBe(OAuthProvider.GOOGLE);
      expect(result.data.providerAccountId).toBe('provider-account-123');
    }
  });

  it('should validate body with optional confirmationToken', () => {
    const body = {
      mode: UnlinkingMode.DIRECT,
      provider: OAuthProvider.GOOGLE,
      providerAccountId: 'provider-account-123',
      confirmationToken: 'token-123'
    };

    const result = UnlinkProviderBodySchema.safeParse(body);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.confirmationToken).toBe('token-123');
    }
  });

  it('should reject body without mode', () => {
    const body = {
      provider: OAuthProvider.GOOGLE,
      providerAccountId: 'provider-account-123'
    };

    const result = UnlinkProviderBodySchema.safeParse(body);

    expect(result.success).toBe(false);
  });

  it('should reject body without provider', () => {
    const body = {
      mode: UnlinkingMode.DIRECT,
      providerAccountId: 'provider-account-123'
    };

    const result = UnlinkProviderBodySchema.safeParse(body);

    expect(result.success).toBe(false);
  });

  it('should reject body without providerAccountId', () => {
    const body = {
      mode: UnlinkingMode.DIRECT,
      provider: OAuthProvider.GOOGLE
    };

    const result = UnlinkProviderBodySchema.safeParse(body);

    expect(result.success).toBe(false);
  });

  it('should reject empty providerAccountId', () => {
    const body = {
      mode: UnlinkingMode.DIRECT,
      provider: OAuthProvider.GOOGLE,
      providerAccountId: ''
    };

    const result = UnlinkProviderBodySchema.safeParse(body);

    expect(result.success).toBe(false);
  });

  it('should validate all unlinking modes', () => {
    const modes = [UnlinkingMode.DIRECT, UnlinkingMode.CONFIRM];
    
    modes.forEach(mode => {
      const body = {
        mode,
        provider: OAuthProvider.GOOGLE,
        providerAccountId: 'provider-account-123'
      };

      const result = UnlinkProviderBodySchema.safeParse(body);
      expect(result.success).toBe(true);
    });
  });

  it('should validate all OAuth providers', () => {
    const providers = [OAuthProvider.GOOGLE, OAuthProvider.MICROSOFT_365, OAuthProvider.APPLE];
    
    providers.forEach(provider => {
      const body = {
        mode: UnlinkingMode.DIRECT,
        provider,
        providerAccountId: 'provider-account-123'
      };

      const result = UnlinkProviderBodySchema.safeParse(body);
      expect(result.success).toBe(true);
    });
  });

  it('should reject invalid mode enum', () => {
    const body = {
      mode: 'INVALID_MODE' as any,
      provider: OAuthProvider.GOOGLE,
      providerAccountId: 'provider-account-123'
    };

    const result = UnlinkProviderBodySchema.safeParse(body);

    expect(result.success).toBe(false);
  });

  it('should reject invalid provider enum', () => {
    const body = {
      mode: UnlinkingMode.DIRECT,
      provider: 'INVALID_PROVIDER' as any,
      providerAccountId: 'provider-account-123'
    };

    const result = UnlinkProviderBodySchema.safeParse(body);

    expect(result.success).toBe(false);
  });
});

describe('UnlinkProviderResponseSchema', () => {
  it('should validate minimal response', () => {
    const response = {
      unlinked: false,
      provider: OAuthProvider.GOOGLE,
      providerAccountId: 'provider-account-123',
      status: ProviderUnlinkingStatus.SUCCESS
    };

    const result = UnlinkProviderResponseSchema.safeParse(response);

    expect(result.success).toBe(true);
  });

  it('should validate response with all fields', () => {
    const response = {
      unlinked: true,
      provider: OAuthProvider.GOOGLE,
      providerAccountId: 'provider-account-123',
      unlinkedAt: '2024-01-15T00:00:00Z',
      status: ProviderUnlinkingStatus.SUCCESS,
      message: 'Provider unlinked successfully'
    };

    const result = UnlinkProviderResponseSchema.safeParse(response);

    expect(result.success).toBe(true);
  });

  it('should reject response without unlinked field', () => {
    const response = {
      provider: OAuthProvider.GOOGLE,
      providerAccountId: 'provider-account-123',
      status: ProviderUnlinkingStatus.SUCCESS
    };

    const result = UnlinkProviderResponseSchema.safeParse(response);

    expect(result.success).toBe(false);
  });

  it('should reject invalid datetime format', () => {
    const response = {
      unlinked: true,
      provider: OAuthProvider.GOOGLE,
      providerAccountId: 'provider-account-123',
      unlinkedAt: 'invalid-date',
      status: ProviderUnlinkingStatus.SUCCESS
    };

    const result = UnlinkProviderResponseSchema.safeParse(response);

    expect(result.success).toBe(false);
  });

  it('should validate all status values', () => {
    const statuses = [ProviderUnlinkingStatus.SUCCESS, ProviderUnlinkingStatus.FAILED, ProviderUnlinkingStatus.CONFLICT, ProviderUnlinkingStatus.NOT_FOUND, ProviderUnlinkingStatus.NOT_ALLOWED];
    
    statuses.forEach(status => {
      const response = {
        unlinked: status === ProviderUnlinkingStatus.SUCCESS,
        provider: OAuthProvider.GOOGLE,
        providerAccountId: 'provider-account-123',
        status
      };

      const result = UnlinkProviderResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
    });
  });
});

