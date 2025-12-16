/**
 * @fileoverview i18n web configuration tests
 * @summary Smoke tests for i18n.web.ts
 */

import i18n from '../../../src/i18n/config/i18n.web';

describe('i18n web config', () => {
  it('should initialize i18n instance', () => {
    expect(i18n.isInitialized).toBe(true);
  });

  it('should have web-specific resources configured', () => {
    const resources = i18n.options.resources ?? {};
    expect(resources).toHaveProperty('en');
    expect(resources).toHaveProperty('es');
  });
});


