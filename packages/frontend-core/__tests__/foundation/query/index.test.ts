/**
 * @fileoverview Query Foundation Barrel Tests - Ensures barrel re-exports work correctly
 * @summary Tests for foundation/query/index.ts barrel exports
 */

import * as QueryFoundation from '../../../src/foundation/query/index';
import * as QueryKeysMod from '../../../src/foundation/query/queryKeys';

describe('foundation/query index (barrel) re-exports', () => {
  it('re-exports queryKeys', () => {
    expect(QueryFoundation.queryKeys).toBe(QueryKeysMod.queryKeys);
  });

  it('smoke-tests exported values', () => {
    expect(QueryFoundation.queryKeys).toBeDefined();
    expect(QueryFoundation.queryKeys.auth.me).toEqual(['auth', 'me']);
  });
});

