/**
 * @file config.index.test.ts
 * @summary Ensures the barrel file re-exports the public config API (100% line coverage).
 */

import * as Config from '../../src/config/index.js';
import { loadFeatureFlags } from '../../src/config/flags.js';
import { buildDefaultCors } from '../../src/config/cors.js';
import { defaultRateLimit } from '../../src/config/rateLimit.js';
import { EnvSecretProvider } from '../../src/config/secrets.js';
import { buildAppConfig, corsFromConfig } from '../../src/config/app.js';

describe('config index (barrel) re-exports', () => {
  /**
   * Verifies symbol identity between direct imports and the barrel.
   */
  it('re-exports the expected symbols from each module', () => {
    expect(Config.loadFeatureFlags).toBe(loadFeatureFlags);
    expect(Config.buildDefaultCors).toBe(buildDefaultCors);
    expect(Config.defaultRateLimit).toBe(defaultRateLimit);
    expect(Config.EnvSecretProvider).toBe(EnvSecretProvider);
    expect(Config.buildAppConfig).toBe(buildAppConfig);
    expect(Config.corsFromConfig).toBe(corsFromConfig);
  });

  /**
   * Smoke-tests the re-exported functions/classes to ensure they are callable
   * via the barrel and behave as the originals.
   */
  it('exposes callable implementations via the barrel', async () => {
    // buildDefaultCors
    const corsCfg = Config.buildDefaultCors(['https://a.example'], true);
    expect(corsCfg.allowOrigins).toEqual(['https://a.example']);
    expect(corsCfg.allowCredentials).toBe(true);

    // defaultRateLimit
    const rateCfg = Config.defaultRateLimit('prod');
    expect(rateCfg.limitPerMinute).toBe(900);
    expect(rateCfg.burst).toBe(200);
    expect(rateCfg.emitHeaders).toBe(true);

    // loadFeatureFlags
    const ORIGINAL_ENV = process.env;
    process.env = { ...ORIGINAL_ENV, FF_BARREL_CHECK: 'on' };
    try {
      const flags = Config.loadFeatureFlags();
      expect(flags.BARREL_CHECK).toBe(true);
    } finally {
      process.env = ORIGINAL_ENV;
    }

    // EnvSecretProvider
    const provider = new Config.EnvSecretProvider('SEC_');
    const ORIGINAL_ENV2 = process.env;
    process.env = { ...ORIGINAL_ENV2, SEC_TEST_SECRET: 'secret-value' };
    try {
      await expect(provider.getSecret('TEST_SECRET')).resolves.toBe('secret-value');
    } finally {
      process.env = ORIGINAL_ENV2;
    }
  });
});
