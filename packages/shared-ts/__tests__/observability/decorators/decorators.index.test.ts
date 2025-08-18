/**
 * @file decorators.index.test.ts
 * @summary Verifies that the decorators barrel re-exports the public API.
 */

import * as barrel from '../../../src/observability/decorators/index.js';
import { withLogging } from '../../../src/observability/decorators/withLogging.js';
import { withMetrics } from '../../../src/observability/decorators/withMetrics.js';
import { withTracing } from '../../../src/observability/decorators/withTracing.js';
import { withRetry } from '../../../src/observability/decorators/withRetry.js';

describe('decorators index (barrel)', () => {
  it('re-exports withLogging', () => {
    expect(barrel.withLogging).toBe(withLogging);
    expect(typeof barrel.withLogging).toBe('function');
  });

  it('re-exports withMetrics', () => {
    expect(barrel.withMetrics).toBe(withMetrics);
    expect(typeof barrel.withMetrics).toBe('function');
  });

  it('re-exports withTracing', () => {
    expect(barrel.withTracing).toBe(withTracing);
    expect(typeof barrel.withTracing).toBe('function');
  });

  it('re-exports withRetry', () => {
    expect(barrel.withRetry).toBe(withRetry);
    expect(typeof barrel.withRetry).toBe('function');
  });

  it('only exposes the expected named exports', () => {
    const exported = Object.keys(barrel)
      .filter((k) => k !== '__esModule')
      .sort();

    expect(exported).toEqual(
      ['withLogging', 'withMetrics', 'withTracing', 'withRetry'].sort()
    );
  });
});
