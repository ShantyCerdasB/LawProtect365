/**
 * @fileoverview Unit tests for mapAddSigners utility
 * @summary Tests for signer data mapping with orchestration fields
 * @description Comprehensive test suite for mapAddSigners utility covering all business logic,
 * data transformation, edge cases, and type safety for signer orchestration.
 */

import { jest, describe, it, expect } from '@jest/globals';
import { mapAddSigners, MappedSigner } from '../../../../../src/services/orchestrators/utils/mapAddSigners';
import { EnvelopeId } from '../../../../../src/domain/value-objects/EnvelopeId';
import { ParticipantRole } from '@prisma/client';
import { TestUtils } from '../../../../helpers/testUtils';

describe('mapAddSigners', () => {
  describe('mapAddSigners function', () => {
    it('should return empty array when addSigners is undefined', () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const userId = TestUtils.generateUuid();

      const result = mapAddSigners(undefined, envelopeId, userId);

      expect(result).toEqual([]);
    });

    it('should return empty array when addSigners is empty', () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const userId = TestUtils.generateUuid();

      const result = mapAddSigners([], envelopeId, userId);

      expect(result).toEqual([]);
    });

    it('should map single signer with all required fields', () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const userId = TestUtils.generateUuid();
      const signerData = {
        email: 'signer@example.com',
        fullName: 'John Doe',
        order: 1
      };

      const result = mapAddSigners([signerData], envelopeId, userId);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        ...signerData,
        envelopeId,
        participantRole: ParticipantRole.SIGNER,
        invitedByUserId: userId
      });
    });

    it('should map multiple signers with all required fields', () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const userId = TestUtils.generateUuid();
      const signersData = [
        {
          email: 'signer1@example.com',
          fullName: 'John Doe',
          order: 1
        },
        {
          email: 'signer2@example.com',
          fullName: 'Jane Smith',
          order: 2
        }
      ];

      const result = mapAddSigners(signersData, envelopeId, userId);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        ...signersData[0],
        envelopeId,
        participantRole: ParticipantRole.SIGNER,
        invitedByUserId: userId
      });
      expect(result[1]).toEqual({
        ...signersData[1],
        envelopeId,
        participantRole: ParticipantRole.SIGNER,
        invitedByUserId: userId
      });
    });

    it('should preserve all original signer properties', () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const userId = TestUtils.generateUuid();
      const signerData = {
        email: 'signer@example.com',
        fullName: 'John Doe',
        order: 1,
        customField: 'customValue',
        metadata: { source: 'api' },
        isExternal: true
      };

      const result = mapAddSigners([signerData], envelopeId, userId);

      expect(result[0]).toMatchObject({
        email: 'signer@example.com',
        fullName: 'John Doe',
        order: 1,
        customField: 'customValue',
        metadata: { source: 'api' },
        isExternal: true
      });
    });

    it('should add orchestration fields to each signer', () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const userId = TestUtils.generateUuid();
      const signersData = [
        { email: 'signer1@example.com', fullName: 'John Doe' },
        { email: 'signer2@example.com', fullName: 'Jane Smith' }
      ];

      const result = mapAddSigners(signersData, envelopeId, userId);

      result.forEach(signer => {
        expect(signer).toHaveProperty('envelopeId', envelopeId);
        expect(signer).toHaveProperty('participantRole', ParticipantRole.SIGNER);
        expect(signer).toHaveProperty('invitedByUserId', userId);
      });
    });

    it('should handle signers with minimal data', () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const userId = TestUtils.generateUuid();
      const signerData = {
        email: 'signer@example.com'
      };

      const result = mapAddSigners([signerData], envelopeId, userId);

      expect(result[0]).toEqual({
        email: 'signer@example.com',
        envelopeId,
        participantRole: ParticipantRole.SIGNER,
        invitedByUserId: userId
      });
    });

    it('should handle signers with complex nested data', () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const userId = TestUtils.generateUuid();
      const signerData = {
        email: 'signer@example.com',
        fullName: 'John Doe',
        preferences: {
          notifications: true,
          language: 'en'
        },
        tags: ['urgent', 'legal'],
        metadata: {
          source: 'api',
          version: '1.0',
          nested: {
            value: 'test'
          }
        }
      };

      const result = mapAddSigners([signerData], envelopeId, userId);

      expect(result[0]).toMatchObject({
        email: 'signer@example.com',
        fullName: 'John Doe',
        preferences: {
          notifications: true,
          language: 'en'
        },
        tags: ['urgent', 'legal'],
        metadata: {
          source: 'api',
          version: '1.0',
          nested: {
            value: 'test'
          }
        }
      });
    });

    it('should maintain referential integrity of EnvelopeId', () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const userId = TestUtils.generateUuid();
      const signersData = [
        { email: 'signer1@example.com' },
        { email: 'signer2@example.com' }
      ];

      const result = mapAddSigners(signersData, envelopeId, userId);

      result.forEach(signer => {
        expect(signer.envelopeId).toBe(envelopeId);
        expect(signer.envelopeId).toBeInstanceOf(EnvelopeId);
      });
    });

    it('should handle readonly array input', () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const userId = TestUtils.generateUuid();
      const signersData = [
        { email: 'signer1@example.com' },
        { email: 'signer2@example.com' }
      ] as const;

      const result = mapAddSigners(signersData, envelopeId, userId);

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('envelopeId', envelopeId);
      expect(result[1]).toHaveProperty('envelopeId', envelopeId);
    });

    it('should preserve type safety with generic constraints', () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const userId = TestUtils.generateUuid();
      
      interface CustomSignerData extends Record<string, unknown> {
        email: string;
        fullName: string;
        customField: number;
      }

      const signersData: CustomSignerData[] = [
        {
          email: 'signer@example.com',
          fullName: 'John Doe',
          customField: 42
        }
      ];

      const result = mapAddSigners(signersData, envelopeId, userId);

      expect(result[0]).toMatchObject({
        email: 'signer@example.com',
        fullName: 'John Doe',
        customField: 42,
        envelopeId,
        participantRole: ParticipantRole.SIGNER,
        invitedByUserId: userId
      });
    });
  });

  describe('MappedSigner type', () => {
    it('should extend base signer data with orchestration fields', () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const userId = TestUtils.generateUuid();
      
      interface BaseSigner extends Record<string, unknown> {
        email: string;
        fullName: string;
      }

      const baseSigner: BaseSigner = {
        email: 'signer@example.com',
        fullName: 'John Doe'
      };

      const mappedSigner: MappedSigner<BaseSigner> = {
        ...baseSigner,
        envelopeId,
        participantRole: ParticipantRole.SIGNER,
        invitedByUserId: userId
      };

      expect(mappedSigner).toHaveProperty('email', 'signer@example.com');
      expect(mappedSigner).toHaveProperty('fullName', 'John Doe');
      expect(mappedSigner).toHaveProperty('envelopeId', envelopeId);
      expect(mappedSigner).toHaveProperty('participantRole', ParticipantRole.SIGNER);
      expect(mappedSigner).toHaveProperty('invitedByUserId', userId);
    });

    it('should work with empty base type', () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const userId = TestUtils.generateUuid();

      const mappedSigner: MappedSigner<Record<string, unknown>> = {
        envelopeId,
        participantRole: ParticipantRole.SIGNER,
        invitedByUserId: userId
      };

      expect(mappedSigner).toHaveProperty('envelopeId', envelopeId);
      expect(mappedSigner).toHaveProperty('participantRole', ParticipantRole.SIGNER);
      expect(mappedSigner).toHaveProperty('invitedByUserId', userId);
    });
  });

  describe('Edge cases', () => {
    it('should handle signers with undefined values', () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const userId = TestUtils.generateUuid();
      const signerData = {
        email: 'signer@example.com',
        fullName: undefined,
        order: null
      };

      const result = mapAddSigners([signerData], envelopeId, userId);

      expect(result[0]).toMatchObject({
        email: 'signer@example.com',
        fullName: undefined,
        order: null,
        envelopeId,
        participantRole: ParticipantRole.SIGNER,
        invitedByUserId: userId
      });
    });

    it('should handle signers with empty strings', () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const userId = TestUtils.generateUuid();
      const signerData = {
        email: '',
        fullName: '',
        order: 0
      };

      const result = mapAddSigners([signerData], envelopeId, userId);

      expect(result[0]).toMatchObject({
        email: '',
        fullName: '',
        order: 0,
        envelopeId,
        participantRole: ParticipantRole.SIGNER,
        invitedByUserId: userId
      });
    });

    it('should handle large arrays efficiently', () => {
      const envelopeId = TestUtils.generateEnvelopeId();
      const userId = TestUtils.generateUuid();
      const signersData = Array.from({ length: 1000 }, (_, index) => ({
        email: `signer${index}@example.com`,
        fullName: `Signer ${index}`,
        order: index
      }));

      const result = mapAddSigners(signersData, envelopeId, userId);

      expect(result).toHaveLength(1000);
      result.forEach((signer, index) => {
        expect(signer).toHaveProperty('email', `signer${index}@example.com`);
        expect(signer).toHaveProperty('envelopeId', envelopeId);
        expect(signer).toHaveProperty('participantRole', ParticipantRole.SIGNER);
        expect(signer).toHaveProperty('invitedByUserId', userId);
      });
    });
  });
});
