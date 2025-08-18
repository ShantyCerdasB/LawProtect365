/**
 * @file secrets.test.ts
 * @summary Tests for EnvSecretProvider (100% line & branch coverage).
 */

import { EnvSecretProvider } from '../../src/config/secrets.js';

const ORIGINAL_ENV = process.env;

beforeEach(() => {
  // Fresh copy of env for isolation
  process.env = { ...ORIGINAL_ENV };

  // Clean keys that this suite may create
  delete process.env.JWT_PUBLIC_JWKS;
  delete process.env.DOCUSIGN_API_KEY;
  delete process.env.SEC_JWT_PUBLIC_JWKS;
  delete process.env.SEC_DOCUSIGN_API_KEY;
  delete (process.env as any).EMPTY_SECRET;
});

afterAll(() => {
  process.env = ORIGINAL_ENV;
});

describe('EnvSecretProvider', () => {
  /**
   * Ensures secrets resolve from process.env without a prefix and that
   * unknown keys return undefined.
   */
  it('reads secrets without a prefix and returns undefined for missing keys', async () => {
    process.env.JWT_PUBLIC_JWKS = 'jwks-value';
    const provider = new EnvSecretProvider();

    await expect(provider.getSecret('JWT_PUBLIC_JWKS')).resolves.toBe('jwks-value');
    await expect(provider.getSecret('UNKNOWN_KEY')).resolves.toBeUndefined();
  });

  /**
   * Ensures the provided prefix is applied to the lookup key.
   * Verifies that prefixed key takes precedence over an unprefixed one.
   */
  it('applies the prefix when provided', async () => {
    process.env.JWT_PUBLIC_JWKS = 'base-value';
    process.env.SEC_JWT_PUBLIC_JWKS = 'prefixed-value';

    const provider = new EnvSecretProvider('SEC_');
    await expect(provider.getSecret('JWT_PUBLIC_JWKS')).resolves.toBe('prefixed-value');
  });

  /**
   * Ensures empty-string values are returned as-is (not coerced to undefined)
   * and that an explicit empty prefix does not alter the lookup key.
   */
  it('returns empty-string secrets and honors empty prefix', async () => {
    process.env.EMPTY_SECRET = '';
    const provider = new EnvSecretProvider('');

    await expect(provider.getSecret('EMPTY_SECRET')).resolves.toBe('');
  });

  /**
   * Ensures the prefix concatenation works with different secret names.
   */
  it('looks up arbitrary secret ids with a prefix', async () => {
    process.env.SEC_DOCUSIGN_API_KEY = 'docusign-secret';
    const provider = new EnvSecretProvider('SEC_');

    await expect(provider.getSecret('DOCUSIGN_API_KEY')).resolves.toBe('docusign-secret');
  });
});
