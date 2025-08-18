/**
 * @file app.config.test.ts
 * @summary Tests for buildAppConfig and corsFromConfig (full branch coverage).
 */

// Important: mock with the SAME specifier the SUT uses
jest.mock('@validation/env.js', () => ({
  loadEnv: jest.fn(),
  Env: {}, // placeholder shape
}));

// These are relative in the SUT; use resolved paths from the test
jest.mock('../../src/config/flags.js', () => ({
  loadFeatureFlags: jest.fn(),
}));
jest.mock('../../src/config/rateLimit.js', () => ({
  defaultRateLimit: jest.fn(),
}));
jest.mock('../../src/config/cors.js', () => ({
  buildDefaultCors: jest.fn((origins: string[] | '*') => ({ origins })), // simple echo
}));

import { buildAppConfig, corsFromConfig } from '../../src/config/app.js';
import { loadFeatureFlags } from '../../src/config/flags.js';
import { defaultRateLimit } from '../../src/config/rateLimit.js';
import { buildDefaultCors } from '../../src/config/cors.js';
import type { AppConfig } from '../../src/config/types.js';

// Access the mocked alias module without triggering TS path resolution
const envMod = jest.requireMock('@validation/env.js') as { loadEnv: jest.Mock };
const envMock = envMod.loadEnv;

const flagsMock = loadFeatureFlags as unknown as jest.Mock;
const rateMock = defaultRateLimit as unknown as jest.Mock;
const corsMock = buildDefaultCors as unknown as jest.Mock;

const ORIGINAL_ENV = process.env;

beforeEach(() => {
  jest.clearAllMocks();
  process.env = { ...ORIGINAL_ENV };
  delete process.env.CORS_ALLOWED_ORIGINS;
});

afterAll(() => {
  process.env = ORIGINAL_ENV;
});

describe('buildAppConfig', () => {
  it('uses defaults for env/logLevel and CORS when not set', () => {
    envMock.mockReturnValueOnce({
      PROJECT_NAME: 'proj',
      SERVICE_NAME: 'svc',
      AWS_REGION: 'us-east-1',
      // ENV, LOG_LEVEL undefined -> fallbacks apply
    });
    flagsMock.mockReturnValueOnce({ featureA: true });
    rateMock.mockImplementationOnce((env: string) => ({ windowMs: env === 'dev' ? 1000 : 0, max: 50 }));

    const cfg = buildAppConfig();

    expect(cfg).toMatchObject({
      projectName: 'proj',
      serviceName: 'svc',
      region: 'us-east-1',
      env: 'dev',
      logLevel: 'info',
      isDev: true,
      isStaging: false,
      isProd: false,
      corsAllowedOrigins: '*',
      flags: { featureA: true },
      rateLimit: { windowMs: 1000, max: 50 },
      jwtIssuer: undefined,
      jwtAudience: undefined,
    });
    expect(rateMock).toHaveBeenCalledWith('dev');
  });

  it('respects ENV=staging, LOG_LEVEL=warn and CORS="*"', () => {
    process.env.CORS_ALLOWED_ORIGINS = '*';

    envMock.mockReturnValueOnce({
      PROJECT_NAME: 'p2',
      SERVICE_NAME: 'svc2',
      AWS_REGION: 'eu-west-1',
      ENV: 'staging',
      LOG_LEVEL: 'warn',
    });
    flagsMock.mockReturnValueOnce({ ff: true });
    rateMock.mockImplementationOnce((env: string) => ({ bucket: env, max: 5 }));

    const cfg = buildAppConfig();

    expect(cfg).toMatchObject({
      projectName: 'p2',
      serviceName: 'svc2',
      region: 'eu-west-1',
      env: 'staging',
      logLevel: 'warn',
      isDev: false,
      isStaging: true,
      isProd: false,
      corsAllowedOrigins: '*',
      flags: { ff: true },
      rateLimit: { bucket: 'staging', max: 5 },
    });
    expect(rateMock).toHaveBeenCalledWith('staging');
  });

  it('parses CORS_ALLOWED_ORIGINS list and merges overrides last', () => {
    process.env.CORS_ALLOWED_ORIGINS = '  https://a.com , ,https://b.com  ,  ';
    envMock.mockReturnValueOnce({
      PROJECT_NAME: 'p3',
      SERVICE_NAME: 'svc3',
      AWS_REGION: 'ap-south-1',
      ENV: 'prod',
      LOG_LEVEL: undefined,
      JWT_ISSUER: 'https://issuer',
      JWT_AUDIENCE: 'client',
    });
    flagsMock.mockReturnValueOnce({ f1: true });
    rateMock.mockImplementationOnce(() => ({ windowMs: 2000, max: 10 }));

    const overrides: Partial<AppConfig> = {
      logLevel: 'debug',
      corsAllowedOrigins: ['http://override.local'],
      flags: { f1: false, f2: true }, // ✅ all booleans to satisfy Record<string, boolean>
      rateLimit: { windowMs: 1, max: 1 } as any,
    };

    const cfg = buildAppConfig(overrides);

    // base + overrides
    expect(cfg.env).toBe('prod');
    expect(cfg.isProd).toBe(true);
    expect(cfg.isDev).toBe(false);
    expect(cfg.isStaging).toBe(false);

    // overrides take precedence
    expect(cfg.logLevel).toBe('debug');
    expect(cfg.corsAllowedOrigins).toEqual(['http://override.local']);
    expect(cfg.flags).toEqual({ f1: false, f2: true });
    expect(cfg.rateLimit).toEqual({ windowMs: 1, max: 1 });

    // base JWT values preserved
    expect(cfg.jwtIssuer).toBe('https://issuer');
    expect(cfg.jwtAudience).toBe('client');

    expect(rateMock).toHaveBeenCalledWith('prod');
  });
});

describe('corsFromConfig', () => {
  it('passes through "*" to buildDefaultCors', () => {
    const res = corsFromConfig({ corsAllowedOrigins: '*' } as any);
    expect(corsMock).toHaveBeenCalledWith('*');
    expect(res).toEqual({ origins: '*' });
  });

  it('passes through list to buildDefaultCors', () => {
    const res = corsFromConfig({ corsAllowedOrigins: ['https://a', 'https://b'] } as any);
    expect(corsMock).toHaveBeenCalledWith(['https://a', 'https://b']);
    expect(res).toEqual({ origins: ['https://a', 'https://b'] });
  });

  it('uses "*" when corsAllowedOrigins is undefined', () => {
    const res = corsFromConfig({} as any);
    expect(corsMock).toHaveBeenCalledWith('*');
    expect(res).toEqual({ origins: '*' });
  });
});
