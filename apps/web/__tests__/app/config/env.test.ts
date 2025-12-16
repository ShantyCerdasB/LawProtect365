/**
 * @fileoverview Environment config tests
 * @summary Basic coverage for env.ts
 */

import { env } from '@/app/config/env';

describe('env config', () => {
  it('should have appName constant set correctly', () => {
    expect(env.appName).toBe('LawProtect365');
    expect(typeof env.apiBaseUrl).toBe('string');
  });
});
