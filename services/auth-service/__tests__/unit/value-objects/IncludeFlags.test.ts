/**
 * @fileoverview IncludeFlags Tests - Unit tests for IncludeFlags value object
 * @summary Tests for IncludeFlags validation and methods
 * @description Tests the IncludeFlags value object including validation, flag checking, and active flags retrieval.
 */

import { describe, it, expect } from '@jest/globals';
import { IncludeFlags } from '../../../src/domain/value-objects/IncludeFlags';
import { IncludeFlag } from '../../../src/domain/enums';

describe('IncludeFlags', () => {
  describe('constructor', () => {
    it('should create IncludeFlags with empty string', () => {
      const flags = new IncludeFlags('');

      expect(flags.getValue()).toBe('');
    });

    it('should create IncludeFlags with valid single flag', () => {
      const flags = new IncludeFlags(IncludeFlag.IDP);

      expect(flags.getValue()).toBe(IncludeFlag.IDP);
    });

    it('should create IncludeFlags with valid multiple flags', () => {
      const flags = new IncludeFlags(`${IncludeFlag.IDP},${IncludeFlag.PROFILE}`);

      expect(flags.getValue()).toBe(`${IncludeFlag.IDP},${IncludeFlag.PROFILE}`);
    });

    it('should throw error for invalid flag', () => {
      expect(() => new IncludeFlags('invalid')).toThrow('Invalid include flag');
    });

    it('should throw error for mixed valid and invalid flags', () => {
      expect(() => new IncludeFlags(`${IncludeFlag.IDP},invalid`)).toThrow('Invalid include flag');
    });
  });

  describe('getProviders', () => {
    it('should return true when IDP flag is present', () => {
      const flags = new IncludeFlags(IncludeFlag.IDP);

      expect(flags.getProviders()).toBe(true);
    });

    it('should return true when IDP flag is in comma-separated list', () => {
      const flags = new IncludeFlags(`${IncludeFlag.IDP},${IncludeFlag.PROFILE}`);

      expect(flags.getProviders()).toBe(true);
    });

    it('should return false when IDP flag is not present', () => {
      const flags = new IncludeFlags(IncludeFlag.PROFILE);

      expect(flags.getProviders()).toBe(false);
    });

    it('should return false for empty flags', () => {
      const flags = new IncludeFlags('');

      expect(flags.getProviders()).toBe(false);
    });
  });

  describe('getProfile', () => {
    it('should return true when PROFILE flag is present', () => {
      const flags = new IncludeFlags(IncludeFlag.PROFILE);

      expect(flags.getProfile()).toBe(true);
    });

    it('should return true when PROFILE flag is in comma-separated list', () => {
      const flags = new IncludeFlags(`${IncludeFlag.IDP},${IncludeFlag.PROFILE}`);

      expect(flags.getProfile()).toBe(true);
    });

    it('should return false when PROFILE flag is not present', () => {
      const flags = new IncludeFlags(IncludeFlag.IDP);

      expect(flags.getProfile()).toBe(false);
    });
  });

  describe('getClaims', () => {
    it('should return true when CLAIMS flag is present', () => {
      const flags = new IncludeFlags(IncludeFlag.CLAIMS);

      expect(flags.getClaims()).toBe(true);
    });

    it('should return true when CLAIMS flag is in comma-separated list', () => {
      const flags = new IncludeFlags(`${IncludeFlag.IDP},${IncludeFlag.CLAIMS}`);

      expect(flags.getClaims()).toBe(true);
    });

    it('should return false when CLAIMS flag is not present', () => {
      const flags = new IncludeFlags(IncludeFlag.IDP);

      expect(flags.getClaims()).toBe(false);
    });
  });

  describe('getActiveFlags', () => {
    it('should return empty array for empty flags', () => {
      const flags = new IncludeFlags('');

      expect(flags.getActiveFlags()).toEqual([]);
    });

    it('should return single flag as array', () => {
      const flags = new IncludeFlags(IncludeFlag.IDP);

      expect(flags.getActiveFlags()).toEqual([IncludeFlag.IDP]);
    });

    it('should return multiple flags as array', () => {
      const flags = new IncludeFlags(`${IncludeFlag.IDP},${IncludeFlag.PROFILE},${IncludeFlag.CLAIMS}`);

      expect(flags.getActiveFlags()).toEqual([IncludeFlag.IDP, IncludeFlag.PROFILE, IncludeFlag.CLAIMS]);
    });

    it('should trim whitespace from flags', () => {
      const flags = new IncludeFlags(` ${IncludeFlag.IDP} , ${IncludeFlag.PROFILE} `);

      expect(flags.getActiveFlags()).toEqual([IncludeFlag.IDP, IncludeFlag.PROFILE]);
    });
  });

  describe('hasAnyFlags', () => {
    it('should return false for empty flags', () => {
      const flags = new IncludeFlags('');

      expect(flags.hasAnyFlags()).toBe(false);
    });

    it('should return true for single flag', () => {
      const flags = new IncludeFlags(IncludeFlag.IDP);

      expect(flags.hasAnyFlags()).toBe(true);
    });

    it('should return true for multiple flags', () => {
      const flags = new IncludeFlags(`${IncludeFlag.IDP},${IncludeFlag.PROFILE}`);

      expect(flags.hasAnyFlags()).toBe(true);
    });
  });
});

