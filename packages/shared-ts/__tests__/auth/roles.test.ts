/**
 * @file roles.test.ts
 * @summary Tests for role helpers: hasRole, hasAtLeastRole, maxRole, toRole, normalizeRoles.
 */

import { hasRole, hasAtLeastRole, maxRole, toRole, normalizeRoles } from '../../src/auth/roles.js';

describe('toRole', () => {
  it('maps synonyms and casing', () => {
    expect(toRole('SUPER-ADMIN')).toBe('super_admin');
    expect(toRole('abogado')).toBe('lawyer');
    expect(toRole('cliente')).toBe('client');
    expect(toRole('system')).toBe('system');
  });

  it('returns undefined for unknown', () => {
    expect(toRole('nope')).toBeUndefined();
  });
});

describe('normalizeRoles', () => {
  it('filters invalid entries', () => {
    expect(normalizeRoles(['ADMIN', 'x', 'client'])).toEqual(['admin', 'client']);
  });
});

describe('hasRole', () => {
  it('checks exact membership after normalization', () => {
    expect(hasRole(['ADMIN'], 'admin')).toBe(true);
    expect(hasRole(['super-admin'], 'super_admin')).toBe(true);
    expect(hasRole(['client'], 'lawyer')).toBe(false);
  });
});

describe('maxRole', () => {
  it('returns strongest role; defaults to client', () => {
    expect(maxRole(['client', 'lawyer'])).toBe('lawyer');
    expect(maxRole(['admin', 'lawyer'])).toBe('admin');
    expect(maxRole(['super_admin', 'admin'])).toBe('super_admin');
    expect(maxRole(['unknown'] as any)).toBe('client');
  });

  it('keeps system if present, but it does not outrank client', () => {
    expect(maxRole(['system'])).toBe('system');
  });
});

describe('hasAtLeastRole', () => {
  it('respects hierarchy client < lawyer < admin < super_admin', () => {
    expect(hasAtLeastRole(['lawyer'], 'client')).toBe(true);
    expect(hasAtLeastRole(['admin'], 'lawyer')).toBe(true);
    expect(hasAtLeastRole(['client'], 'lawyer')).toBe(false);
    expect(hasAtLeastRole(['super_admin'], 'admin')).toBe(true);
  });

  it('treats system as lowest (not above client)', () => {
    expect(hasAtLeastRole(['system'], 'client')).toBe(false);
  });
});
