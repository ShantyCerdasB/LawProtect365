/**
 * @fileoverview HTTP Foundation Barrel Tests - Ensures barrel re-exports work correctly
 * @summary Tests for foundation/http/index.ts barrel exports
 */

import * as HttpFoundation from '../../../src/foundation/http/index';
import * as HttpClientMod from '../../../src/foundation/http/httpClient';
import * as HeadersMod from '../../../src/foundation/http/headers';
import * as ErrorsMod from '../../../src/foundation/http/errors';
import * as TypesMod from '../../../src/foundation/http/types';
import * as InterceptedMod from '../../../src/foundation/http/createInterceptedHttpClient';

describe('foundation/http index (barrel) re-exports', () => {
  it('re-exports createHttpClient function', () => {
    expect(HttpFoundation.createHttpClient).toBe(HttpClientMod.createHttpClient);
  });

  it('re-exports buildContextHeaders', () => {
    expect(HttpFoundation.buildContextHeaders).toBe(HeadersMod.buildContextHeaders);
  });

  it('re-exports HttpError class', () => {
    expect(HttpFoundation.HttpError).toBe(ErrorsMod.HttpError);
  });

  it('re-exports createInterceptedHttpClient function', () => {
    expect(HttpFoundation.createInterceptedHttpClient).toBe(InterceptedMod.createInterceptedHttpClient);
  });

  it('smoke-tests exported functions', () => {
    // Verify functions are callable
    expect(typeof HttpFoundation.createHttpClient).toBe('function');
    expect(typeof HttpFoundation.buildContextHeaders).toBe('function');
    expect(typeof HttpFoundation.createInterceptedHttpClient).toBe('function');
    expect(HttpFoundation.HttpError).toBeDefined();
  });
});

