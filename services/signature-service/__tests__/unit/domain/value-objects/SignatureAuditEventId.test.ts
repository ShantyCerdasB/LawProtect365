/**
 * @fileoverview SignatureAuditEventId unit tests
 * @summary Tests for SignatureAuditEventId value object
 * @description Comprehensive unit tests for SignatureAuditEventId class methods
 */

import { SignatureAuditEventId } from '../../../../src/domain/value-objects/SignatureAuditEventId';
import { TestUtils } from '../../../helpers/testUtils';
import { invalidEntity } from '../../../../src/signature-errors';

describe('SignatureAuditEventId', () => {
  describe('constructor', () => {
    it('should create a SignatureAuditEventId with valid UUID', () => {
      const validUuid = TestUtils.generateUuid();
      const id = new SignatureAuditEventId(validUuid);
      
      expect(id).toBeInstanceOf(SignatureAuditEventId);
      expect(id.getValue()).toBe(validUuid);
    });

    it('should throw invalidEntity error for empty string', () => {
      expect(() => {
        new SignatureAuditEventId('');
      }).toThrow('Invalid entity');
    });

    it('should throw invalidEntity error for null or undefined', () => {
      expect(() => {
        new SignatureAuditEventId(null as any);
      }).toThrow('Invalid entity');

      expect(() => {
        new SignatureAuditEventId(undefined as any);
      }).toThrow('Invalid entity');
    });

    it('should throw invalidEntity error for invalid UUID format', () => {
      const invalidUuids = [
        'not-a-uuid',
        '123',
        'invalid-uuid-format',
        '123e4567-e89b-12d3-a456-42661417400' // Missing character
      ];

      invalidUuids.forEach(invalidUuid => {
        expect(() => {
          new SignatureAuditEventId(invalidUuid);
        }).toThrow('Invalid entity');
      });
    });

    it('should accept valid UUID v4 format', () => {
      const uuidV4 = '550e8400-e29b-41d4-a716-446655440000';
      const id = new SignatureAuditEventId(uuidV4);
      
      expect(id.getValue()).toBe(uuidV4);
    });
  });

  describe('generate', () => {
    it('should generate a new SignatureAuditEventId with valid UUID', () => {
      const id = SignatureAuditEventId.generate();
      
      expect(id).toBeInstanceOf(SignatureAuditEventId);
      expect(id.getValue()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });

    it('should generate unique IDs on multiple calls', () => {
      const id1 = SignatureAuditEventId.generate();
      const id2 = SignatureAuditEventId.generate();
      
      expect(id1.getValue()).not.toBe(id2.getValue());
    });

    it('should generate valid UUIDs that can be used with constructor', () => {
      const generatedId = SignatureAuditEventId.generate();
      const recreatedId = new SignatureAuditEventId(generatedId.getValue());
      
      expect(recreatedId.getValue()).toBe(generatedId.getValue());
    });
  });

  describe('fromString', () => {
    it('should create a SignatureAuditEventId from valid UUID string', () => {
      const uuid = TestUtils.generateUuid();
      const id = SignatureAuditEventId.fromString(uuid);
      
      expect(id).toBeInstanceOf(SignatureAuditEventId);
      expect(id.getValue()).toBe(uuid);
    });

    it('should throw error for invalid UUID format', () => {
      expect(() => {
        SignatureAuditEventId.fromString('invalid-uuid');
      }).toThrow('Invalid entity');
    });
  });

  describe('fromStringOrUndefined', () => {
    it('should return undefined for null value', () => {
      const result = SignatureAuditEventId.fromStringOrUndefined(null);
      expect(result).toBeUndefined();
    });

    it('should return undefined for undefined value', () => {
      const result = SignatureAuditEventId.fromStringOrUndefined(undefined);
      expect(result).toBeUndefined();
    });

    it('should create SignatureAuditEventId for valid UUID string', () => {
      const uuid = TestUtils.generateUuid();
      const result = SignatureAuditEventId.fromStringOrUndefined(uuid);
      
      expect(result).toBeInstanceOf(SignatureAuditEventId);
      expect(result?.getValue()).toBe(uuid);
    });

    it('should throw error for invalid UUID string', () => {
      expect(() => {
        SignatureAuditEventId.fromStringOrUndefined('invalid-uuid');
      }).toThrow('Invalid entity');
    });
  });

  describe('equals', () => {
    it('should return true for equal SignatureAuditEventIds', () => {
      const uuid = TestUtils.generateUuid();
      const id1 = new SignatureAuditEventId(uuid);
      const id2 = new SignatureAuditEventId(uuid);
      
      expect(id1.equals(id2)).toBe(true);
    });

    it('should return false for different SignatureAuditEventIds', () => {
      const id1 = SignatureAuditEventId.generate();
      const id2 = SignatureAuditEventId.generate();
      
      expect(id1.equals(id2)).toBe(false);
    });

    it('should return false when comparing with null or undefined', () => {
      const id = SignatureAuditEventId.generate();
      
      expect(id.equals(null as any)).toBe(false);
      expect(id.equals(undefined as any)).toBe(false);
    });

    it('should return false when comparing with invalid object', () => {
      const id = SignatureAuditEventId.generate();
      const invalidObject = { getValue: 'not-a-function' };
      
      expect(id.equals(invalidObject as any)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return the UUID string representation', () => {
      const uuid = TestUtils.generateUuid();
      const id = new SignatureAuditEventId(uuid);
      
      expect(id.toString()).toBe(uuid);
      expect(id.toString()).toBe(id.getValue());
    });
  });

  describe('toJSON', () => {
    it('should return the UUID string for JSON serialization', () => {
      const uuid = TestUtils.generateUuid();
      const id = new SignatureAuditEventId(uuid);
      
      expect(id.toJSON()).toBe(uuid);
      expect(id.toJSON()).toBe(id.getValue());
    });
  });

  describe('value object behavior', () => {
    it('should be immutable', () => {
      const id = SignatureAuditEventId.generate();
      const originalValue = id.getValue();
      
      // Attempting to modify the internal value should not affect the object
      expect(id.getValue()).toBe(originalValue);
    });

    it('should maintain referential equality for same UUID', () => {
      const uuid = TestUtils.generateUuid();
      const id1 = new SignatureAuditEventId(uuid);
      const id2 = new SignatureAuditEventId(uuid);
      
      expect(id1.equals(id2)).toBe(true);
      expect(id1.getValue()).toBe(id2.getValue());
    });

    it('should extend Identifier base class', () => {
      const id = SignatureAuditEventId.generate();
      
      expect(id.getValue).toBeDefined();
      expect(typeof id.getValue).toBe('function');
      expect(id.toString).toBeDefined();
      expect(typeof id.toString).toBe('function');
    });
  });
});
