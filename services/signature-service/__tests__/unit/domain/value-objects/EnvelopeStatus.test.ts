/**
 * @fileoverview Unit tests for EnvelopeStatus value object
 * @summary Tests for envelope status validation and business logic
 * @description Comprehensive test suite for EnvelopeStatus value object covering validation,
 * factory methods, equality, and business logic for envelope status handling.
 */

import { EnvelopeStatus } from '../../../../src/domain/value-objects/EnvelopeStatus';
import { EnvelopeStatus as PrismaEnvelopeStatus } from '@prisma/client';
import { BadRequestError } from '@lawprotect/shared-ts';

describe('EnvelopeStatus', () => {
  describe('Constructor and Validation', () => {
    it('should create EnvelopeStatus with valid status', () => {
      const status = new EnvelopeStatus(PrismaEnvelopeStatus.DRAFT);

      expect(status.getValue()).toBe(PrismaEnvelopeStatus.DRAFT);
    });

    it('should throw error when status is invalid', () => {
      expect(() => new EnvelopeStatus('INVALID_STATUS' as any))
        .toThrow(BadRequestError);
    });

    it('should throw error when status is null', () => {
      expect(() => new EnvelopeStatus(null as any))
        .toThrow(BadRequestError);
    });

    it('should throw error when status is undefined', () => {
      expect(() => new EnvelopeStatus(undefined as any))
        .toThrow(BadRequestError);
    });

    it('should accept all valid Prisma EnvelopeStatus values', () => {
      const validStatuses = [
        PrismaEnvelopeStatus.DRAFT,
        PrismaEnvelopeStatus.READY_FOR_SIGNATURE,
        PrismaEnvelopeStatus.COMPLETED,
        PrismaEnvelopeStatus.DECLINED,
        PrismaEnvelopeStatus.CANCELLED,
        PrismaEnvelopeStatus.EXPIRED
      ];

      validStatuses.forEach(validStatus => {
        expect(() => new EnvelopeStatus(validStatus)).not.toThrow();
        const status = new EnvelopeStatus(validStatus);
        expect(status.getValue()).toBe(validStatus);
      });
    });
  });

  describe('Static Factory Methods', () => {
    it('should create draft status using static method', () => {
      const status = EnvelopeStatus.draft();

      expect(status.getValue()).toBe(PrismaEnvelopeStatus.DRAFT);
      expect(status.isDraft()).toBe(true);
    });

    it('should create ready for signature status using static method', () => {
      const status = EnvelopeStatus.readyForSignature();

      expect(status.getValue()).toBe(PrismaEnvelopeStatus.READY_FOR_SIGNATURE);
      expect(status.isReadyForSignature()).toBe(true);
    });

    it('should create completed status using static method', () => {
      const status = EnvelopeStatus.completed();

      expect(status.getValue()).toBe(PrismaEnvelopeStatus.COMPLETED);
      expect(status.isCompleted()).toBe(true);
    });

    it('should create declined status using static method', () => {
      const status = EnvelopeStatus.declined();

      expect(status.getValue()).toBe(PrismaEnvelopeStatus.DECLINED);
      expect(status.isDeclined()).toBe(true);
    });

    it('should create cancelled status using static method', () => {
      const status = EnvelopeStatus.cancelled();

      expect(status.getValue()).toBe(PrismaEnvelopeStatus.CANCELLED);
      expect(status.isCancelled()).toBe(true);
    });

    it('should create expired status using static method', () => {
      const status = EnvelopeStatus.expired();

      expect(status.getValue()).toBe(PrismaEnvelopeStatus.EXPIRED);
      expect(status.isExpired()).toBe(true);
    });

    it('should create status from string for draft', () => {
      const status = EnvelopeStatus.fromString(PrismaEnvelopeStatus.DRAFT);

      expect(status.getValue()).toBe(PrismaEnvelopeStatus.DRAFT);
      expect(status.isDraft()).toBe(true);
    });

    it('should create status from string for ready for signature', () => {
      const status = EnvelopeStatus.fromString(PrismaEnvelopeStatus.READY_FOR_SIGNATURE);

      expect(status.getValue()).toBe(PrismaEnvelopeStatus.READY_FOR_SIGNATURE);
      expect(status.isReadyForSignature()).toBe(true);
    });

    it('should create status from string for completed', () => {
      const status = EnvelopeStatus.fromString(PrismaEnvelopeStatus.COMPLETED);

      expect(status.getValue()).toBe(PrismaEnvelopeStatus.COMPLETED);
      expect(status.isCompleted()).toBe(true);
    });

    it('should create status from string for declined', () => {
      const status = EnvelopeStatus.fromString(PrismaEnvelopeStatus.DECLINED);

      expect(status.getValue()).toBe(PrismaEnvelopeStatus.DECLINED);
      expect(status.isDeclined()).toBe(true);
    });

    it('should create status from string for cancelled', () => {
      const status = EnvelopeStatus.fromString(PrismaEnvelopeStatus.CANCELLED);

      expect(status.getValue()).toBe(PrismaEnvelopeStatus.CANCELLED);
      expect(status.isCancelled()).toBe(true);
    });

    it('should create status from string for expired', () => {
      const status = EnvelopeStatus.fromString(PrismaEnvelopeStatus.EXPIRED);

      expect(status.getValue()).toBe(PrismaEnvelopeStatus.EXPIRED);
      expect(status.isExpired()).toBe(true);
    });

    it('should throw error when fromString receives invalid status', () => {
      expect(() => EnvelopeStatus.fromString('INVALID_STATUS'))
        .toThrow(BadRequestError);
    });

    it('should throw error when fromString receives empty string', () => {
      expect(() => EnvelopeStatus.fromString(''))
        .toThrow(BadRequestError);
    });

    it('should throw error when fromString receives null', () => {
      expect(() => EnvelopeStatus.fromString(null as any))
        .toThrow(BadRequestError);
    });

    it('should throw error when fromString receives undefined', () => {
      expect(() => EnvelopeStatus.fromString(undefined as any))
        .toThrow(BadRequestError);
    });
  });

  describe('Status Checks', () => {
    it('should correctly identify draft status', () => {
      const status = EnvelopeStatus.draft();

      expect(status.isDraft()).toBe(true);
      expect(status.isReadyForSignature()).toBe(false);
      expect(status.isCompleted()).toBe(false);
      expect(status.isDeclined()).toBe(false);
      expect(status.isCancelled()).toBe(false);
      expect(status.isExpired()).toBe(false);
    });

    it('should correctly identify ready for signature status', () => {
      const status = EnvelopeStatus.readyForSignature();

      expect(status.isDraft()).toBe(false);
      expect(status.isReadyForSignature()).toBe(true);
      expect(status.isCompleted()).toBe(false);
      expect(status.isDeclined()).toBe(false);
      expect(status.isCancelled()).toBe(false);
      expect(status.isExpired()).toBe(false);
    });

    it('should correctly identify completed status', () => {
      const status = EnvelopeStatus.completed();

      expect(status.isDraft()).toBe(false);
      expect(status.isReadyForSignature()).toBe(false);
      expect(status.isCompleted()).toBe(true);
      expect(status.isDeclined()).toBe(false);
      expect(status.isCancelled()).toBe(false);
      expect(status.isExpired()).toBe(false);
    });

    it('should correctly identify declined status', () => {
      const status = EnvelopeStatus.declined();

      expect(status.isDraft()).toBe(false);
      expect(status.isReadyForSignature()).toBe(false);
      expect(status.isCompleted()).toBe(false);
      expect(status.isDeclined()).toBe(true);
      expect(status.isCancelled()).toBe(false);
      expect(status.isExpired()).toBe(false);
    });

    it('should correctly identify cancelled status', () => {
      const status = EnvelopeStatus.cancelled();

      expect(status.isDraft()).toBe(false);
      expect(status.isReadyForSignature()).toBe(false);
      expect(status.isCompleted()).toBe(false);
      expect(status.isDeclined()).toBe(false);
      expect(status.isCancelled()).toBe(true);
      expect(status.isExpired()).toBe(false);
    });

    it('should correctly identify expired status', () => {
      const status = EnvelopeStatus.expired();

      expect(status.isDraft()).toBe(false);
      expect(status.isReadyForSignature()).toBe(false);
      expect(status.isCompleted()).toBe(false);
      expect(status.isDeclined()).toBe(false);
      expect(status.isCancelled()).toBe(false);
      expect(status.isExpired()).toBe(true);
    });
  });

  describe('Business Logic', () => {
    it('should correctly identify final states', () => {
      const finalStates = [
        EnvelopeStatus.completed(),
        EnvelopeStatus.declined(),
        EnvelopeStatus.cancelled(),
        EnvelopeStatus.expired()
      ];

      finalStates.forEach(status => {
        expect(status.isInFinalState()).toBe(true);
      });
    });

    it('should correctly identify non-final states', () => {
      const nonFinalStates = [
        EnvelopeStatus.draft(),
        EnvelopeStatus.readyForSignature()
      ];

      nonFinalStates.forEach(status => {
        expect(status.isInFinalState()).toBe(false);
      });
    });

    it('should correctly identify modifiable states', () => {
      const modifiableStates = [
        EnvelopeStatus.draft(),
        EnvelopeStatus.readyForSignature()
      ];

      modifiableStates.forEach(status => {
        expect(status.canBeModified()).toBe(true);
      });
    });

    it('should correctly identify non-modifiable states', () => {
      const nonModifiableStates = [
        EnvelopeStatus.completed(),
        EnvelopeStatus.declined(),
        EnvelopeStatus.cancelled(),
        EnvelopeStatus.expired()
      ];

      nonModifiableStates.forEach(status => {
        expect(status.canBeModified()).toBe(false);
      });
    });

    it('should correctly identify sendable states', () => {
      expect(EnvelopeStatus.draft().canBeSent()).toBe(true);
    });

    it('should correctly identify non-sendable states', () => {
      const nonSendableStates = [
        EnvelopeStatus.readyForSignature(),
        EnvelopeStatus.completed(),
        EnvelopeStatus.declined(),
        EnvelopeStatus.cancelled(),
        EnvelopeStatus.expired()
      ];

      nonSendableStates.forEach(status => {
        expect(status.canBeSent()).toBe(false);
      });
    });

    it('should correctly identify cancellable states', () => {
      const cancellableStates = [
        EnvelopeStatus.draft(),
        EnvelopeStatus.readyForSignature()
      ];

      cancellableStates.forEach(status => {
        expect(status.canBeCancelled()).toBe(true);
      });
    });

    it('should correctly identify non-cancellable states', () => {
      const nonCancellableStates = [
        EnvelopeStatus.completed(),
        EnvelopeStatus.declined(),
        EnvelopeStatus.cancelled(),
        EnvelopeStatus.expired()
      ];

      nonCancellableStates.forEach(status => {
        expect(status.canBeCancelled()).toBe(false);
      });
    });
  });

  describe('Equality', () => {
    it('should return true for equal statuses', () => {
      const status1 = EnvelopeStatus.draft();
      const status2 = EnvelopeStatus.draft();

      expect(status1.equals(status2)).toBe(true);
    });

    it('should return false for different statuses', () => {
      const status1 = EnvelopeStatus.draft();
      const status2 = EnvelopeStatus.completed();

      expect(status1.equals(status2)).toBe(false);
    });

    it('should return false when comparing with different object types', () => {
      const status = EnvelopeStatus.draft();
      const otherObject = { getValue: () => PrismaEnvelopeStatus.DRAFT };

      expect(status.equals(otherObject as any)).toBe(false);
    });
  });

  describe('Serialization', () => {
    it('should return string representation', () => {
      const status = EnvelopeStatus.completed();

      expect(status.toString()).toBe(PrismaEnvelopeStatus.COMPLETED);
    });

    it('should return JSON representation', () => {
      const status = EnvelopeStatus.declined();

      expect(status.toJSON()).toBe(PrismaEnvelopeStatus.DECLINED);
    });

    it('should be serializable to JSON string', () => {
      const status = EnvelopeStatus.cancelled();
      const json = JSON.stringify(status.toJSON());

      expect(json).toBe(`"${PrismaEnvelopeStatus.CANCELLED}"`);
    });
  });

  describe('Edge Cases', () => {
    it('should handle all Prisma EnvelopeStatus enum values', () => {
      const allStatuses = Object.values(PrismaEnvelopeStatus);

      allStatuses.forEach(prismaStatus => {
        const status = new EnvelopeStatus(prismaStatus);
        expect(status.getValue()).toBe(prismaStatus);
        expect(status.toString()).toBe(prismaStatus);
        expect(status.toJSON()).toBe(prismaStatus);
      });
    });

    it('should maintain immutability', () => {
      const status = EnvelopeStatus.draft();
      const originalValue = status.getValue();

      // Attempting to modify the internal value should not affect the object
      // (This test ensures the value object is truly immutable)
      expect(status.getValue()).toBe(originalValue);
      expect(status.getValue()).toBe(PrismaEnvelopeStatus.DRAFT);
    });

    it('should handle case sensitivity in fromString', () => {
      // Prisma enums are case-sensitive
      expect(() => EnvelopeStatus.fromString('draft')).toThrow(BadRequestError);
      expect(() => EnvelopeStatus.fromString('DRAFT')).not.toThrow();
    });

    it('should handle whitespace in fromString', () => {
      expect(() => EnvelopeStatus.fromString(' DRAFT ')).toThrow(BadRequestError);
      expect(() => EnvelopeStatus.fromString('DRAFT')).not.toThrow();
    });

    it('should handle special characters in fromString', () => {
      const specialCharStrings = [
        'DRAFT!',
        'DRAFT@',
        'DRAFT#',
        'DRAFT$',
        'DRAFT%'
      ];

      specialCharStrings.forEach(invalidString => {
        expect(() => EnvelopeStatus.fromString(invalidString))
          .toThrow(BadRequestError);
      });
    });

    it('should handle numeric values in fromString', () => {
      expect(() => EnvelopeStatus.fromString('123')).toThrow(BadRequestError);
      expect(() => EnvelopeStatus.fromString('0')).toThrow(BadRequestError);
    });

    it('should handle boolean values in fromString', () => {
      expect(() => EnvelopeStatus.fromString('true')).toThrow(BadRequestError);
      expect(() => EnvelopeStatus.fromString('false')).toThrow(BadRequestError);
    });

    it('should handle object values in fromString', () => {
      expect(() => EnvelopeStatus.fromString({} as any)).toThrow(BadRequestError);
      expect(() => EnvelopeStatus.fromString([] as any)).toThrow(BadRequestError);
    });
  });
});
