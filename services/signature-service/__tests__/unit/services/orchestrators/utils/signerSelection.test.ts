/**
 * @fileoverview Unit tests for signerSelection utilities
 * @summary Tests for signer filtering and selection operations
 * @description Comprehensive test suite for signerSelection utilities, ensuring
 * correct signer filtering, target selection, and edge case handling for
 * orchestration operations.
 */

import { describe, it, expect } from '@jest/globals';
import { selectTargetSigners, filterSignersByIds } from '../../../../../src/services/orchestrators/utils/signerSelection';
import { EnvelopeSigner } from '../../../../../src/domain/entities/EnvelopeSigner';
import { TestUtils } from '../../../../helpers/testUtils';

describe('signerSelection utilities', () => {
  // Helper function to create mock EnvelopeSigner
  const createMockSigner = (id: string): EnvelopeSigner => {
    return {
      getId: () => ({ getValue: () => id })
    } as EnvelopeSigner;
  };

  describe('selectTargetSigners function', () => {
    it('should return all signers when sendToAll is true', () => {
      const signer1 = createMockSigner('signer-1');
      const signer2 = createMockSigner('signer-2');
      const signer3 = createMockSigner('signer-3');

      const externalSigners = [signer1, signer2, signer3];
      const options = { sendToAll: true };

      const result = selectTargetSigners(externalSigners, options);

      expect(result).toEqual(externalSigners);
      expect(result).toHaveLength(3);
    });

    it('should return all signers when options is undefined', () => {
      const signer1 = createMockSigner('signer-1');
      const signer2 = createMockSigner('signer-2');

      const externalSigners = [signer1, signer2];

      const result = selectTargetSigners(externalSigners);

      expect(result).toEqual(externalSigners);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when options is empty', () => {
      const signer1 = createMockSigner('signer-1');

      const externalSigners = [signer1];
      const options = {};

      const result = selectTargetSigners(externalSigners, options);

      expect(result).toHaveLength(0);
    });

    it('should filter signers by specific IDs when sendToAll is false', () => {
      const signer1 = createMockSigner('signer-1');
      const signer2 = createMockSigner('signer-2');
      const signer3 = createMockSigner('signer-3');

      const externalSigners = [signer1, signer2, signer3];
      const options = {
        sendToAll: false,
        signers: [
          { signerId: 'signer-1' },
          { signerId: 'signer-3' }
        ]
      };

      const result = selectTargetSigners(externalSigners, options);

      expect(result).toHaveLength(2);
      expect(result).toContain(signer1);
      expect(result).toContain(signer3);
      expect(result).not.toContain(signer2);
    });

    it('should return empty array when no signers match the criteria', () => {
      const signer1 = createMockSigner('signer-1');
      const signer2 = createMockSigner('signer-2');

      const externalSigners = [signer1, signer2];
      const options = {
        sendToAll: false,
        signers: [{ signerId: 'non-existent-signer' }]
      };

      const result = selectTargetSigners(externalSigners, options);

      expect(result).toHaveLength(0);
    });

    it('should handle empty external signers array', () => {
      const options = { sendToAll: true };

      const result = selectTargetSigners([], options);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should handle empty signers array in options', () => {
      const signer1 = createMockSigner('signer-1');

      const externalSigners = [signer1];
      const options = {
        sendToAll: false,
        signers: []
      };

      const result = selectTargetSigners(externalSigners, options);

      expect(result).toHaveLength(0);
    });

    it('should handle duplicate signer IDs in options', () => {
      const signer1 = createMockSigner('signer-1');
      const signer2 = createMockSigner('signer-2');

      const externalSigners = [signer1, signer2];
      const options = {
        sendToAll: false,
        signers: [
          { signerId: 'signer-1' },
          { signerId: 'signer-1' }, // Duplicate
          { signerId: 'signer-2' }
        ]
      };

      const result = selectTargetSigners(externalSigners, options);

      expect(result).toHaveLength(2);
      expect(result).toContain(signer1);
      expect(result).toContain(signer2);
    });
  });

  describe('filterSignersByIds function', () => {
    it('should filter signers by provided IDs', () => {
      const signer1 = createMockSigner('signer-1');
      const signer2 = createMockSigner('signer-2');
      const signer3 = createMockSigner('signer-3');

      const signers = [signer1, signer2, signer3];
      const signerIds = ['signer-1', 'signer-3'];

      const result = filterSignersByIds(signers, signerIds);

      expect(result).toHaveLength(2);
      expect(result).toContain(signer1);
      expect(result).toContain(signer3);
      expect(result).not.toContain(signer2);
    });

    it('should return empty array when no signers match the IDs', () => {
      const signer1 = createMockSigner('signer-1');
      const signer2 = createMockSigner('signer-2');

      const signers = [signer1, signer2];
      const signerIds = ['non-existent-signer'];

      const result = filterSignersByIds(signers, signerIds);

      expect(result).toHaveLength(0);
    });

    it('should return empty array when signerIds is empty', () => {
      const signer1 = createMockSigner('signer-1');

      const signers = [signer1];
      const signerIds: string[] = [];

      const result = filterSignersByIds(signers, signerIds);

      expect(result).toHaveLength(0);
    });

    it('should return empty array when signers is empty', () => {
      const signerIds = ['signer-1'];

      const result = filterSignersByIds([], signerIds);

      expect(result).toHaveLength(0);
    });

    it('should handle duplicate IDs in signerIds array', () => {
      const signer1 = createMockSigner('signer-1');
      const signer2 = createMockSigner('signer-2');

      const signers = [signer1, signer2];
      const signerIds = ['signer-1', 'signer-1', 'signer-2']; // Duplicate ID

      const result = filterSignersByIds(signers, signerIds);

      expect(result).toHaveLength(2);
      expect(result).toContain(signer1);
      expect(result).toContain(signer2);
    });

    it('should handle single signer filtering', () => {
      const signer1 = createMockSigner('signer-1');
      const signer2 = createMockSigner('signer-2');

      const signers = [signer1, signer2];
      const signerIds = ['signer-1'];

      const result = filterSignersByIds(signers, signerIds);

      expect(result).toHaveLength(1);
      expect(result).toContain(signer1);
      expect(result).not.toContain(signer2);
    });

    it('should handle case-sensitive ID matching', () => {
      const signer1 = createMockSigner('signer-1');
      const signer2 = createMockSigner('signer-2');

      const signers = [signer1, signer2];
      const signerIds = ['SIGNER-1']; // Different case

      const result = filterSignersByIds(signers, signerIds);

      expect(result).toHaveLength(0);
    });

    it('should handle special characters in signer IDs', () => {
      const specialId = 'signer-id-with-special-chars-!@#$%';
      const normalId = 'normal-signer-id';

      const signer1 = createMockSigner(specialId);
      const signer2 = createMockSigner(normalId);

      const signers = [signer1, signer2];
      const signerIds = [specialId];

      const result = filterSignersByIds(signers, signerIds);

      expect(result).toHaveLength(1);
      expect(result).toContain(signer1);
      expect(result).not.toContain(signer2);
    });
  });

  describe('Edge cases', () => {
    it('should handle null and undefined values gracefully', () => {
      const signer1 = createMockSigner('signer-1');

      const externalSigners = [signer1];
      const options = {
        sendToAll: false,
        signers: [
          { signerId: 'signer-1' },
          { signerId: null as any },
          { signerId: undefined as any }
        ]
      };

      const result = selectTargetSigners(externalSigners, options);

      expect(result).toHaveLength(1);
      expect(result).toContain(signer1);
    });

    it('should handle very large arrays efficiently', () => {
      const signers: EnvelopeSigner[] = [];
      const signerIds: string[] = [];

      // Create 1000 signers
      for (let i = 0; i < 1000; i++) {
        const signerId = `signer-${i}`;
        signers.push(createMockSigner(signerId));
        
        // Add every 10th signer to the filter list
        if (i % 10 === 0) {
          signerIds.push(signerId);
        }
      }

      const result = filterSignersByIds(signers, signerIds);

      expect(result).toHaveLength(100);
    });
  });
});