/**
 * @fileoverview Foundation Barrel Tests - Ensures barrel re-exports work correctly
 * @summary Tests for foundation/index.ts barrel exports
 */

import * as Foundation from '../../src/foundation/index';
import * as HttpFoundation from '../../src/foundation/http/index';
import * as QueryFoundation from '../../src/foundation/query/index';

describe('foundation index (barrel) re-exports', () => {
  it('re-exports http foundation', () => {
    expect(Foundation.createHttpClient).toBe(HttpFoundation.createHttpClient);
    expect(Foundation.buildContextHeaders).toBe(HttpFoundation.buildContextHeaders);
  });

  it('re-exports query foundation', () => {
    expect(Foundation.queryKeys).toBe(QueryFoundation.queryKeys);
  });

  it('smoke-tests exported functions', () => {
    expect(typeof Foundation.createHttpClient).toBe('function');
    expect(typeof Foundation.buildContextHeaders).toBe('function');
    expect(Foundation.queryKeys).toBeDefined();
  });
});

