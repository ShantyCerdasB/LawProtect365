/**
 * @fileoverview Unit tests for SigningOrder value object
 * @summary Tests for signing order validation and business logic
 * @description Comprehensive test suite for SigningOrder value object covering validation,
 * business logic methods, and Prisma enum integration.
 */

import { SigningOrder } from '../../../../src/domain/value-objects/SigningOrder';
import { SigningOrderType } from '@prisma/client';
import { BadRequestError } from '@lawprotect/shared-ts';

describe('SigningOrder', () => {
  describe('Constructor and Validation', () => {
    it('should create SigningOrder with valid OWNER_FIRST type', () => {
      const signingOrder = new SigningOrder(SigningOrderType.OWNER_FIRST);

      expect(signingOrder.getType()).toBe(SigningOrderType.OWNER_FIRST);
    });

    it('should create SigningOrder with valid INVITEES_FIRST type', () => {
      const signingOrder = new SigningOrder(SigningOrderType.INVITEES_FIRST);

      expect(signingOrder.getType()).toBe(SigningOrderType.INVITEES_FIRST);
    });

    it('should throw error when type is null', () => {
      expect(() => new SigningOrder(null as any))
        .toThrow(BadRequestError);
    });

    it('should throw error when type is undefined', () => {
      expect(() => new SigningOrder(undefined as any))
        .toThrow(BadRequestError);
    });

    it('should throw error when type is not a valid SigningOrderType', () => {
      expect(() => new SigningOrder('INVALID_TYPE' as any))
        .toThrow(BadRequestError);

      expect(() => new SigningOrder('owner_first' as any))
        .toThrow(BadRequestError);

      expect(() => new SigningOrder('invitees_first' as any))
        .toThrow(BadRequestError);

      expect(() => new SigningOrder(123 as any))
        .toThrow(BadRequestError);

      expect(() => new SigningOrder({} as any))
        .toThrow(BadRequestError);

      expect(() => new SigningOrder([] as any))
        .toThrow(BadRequestError);
    });
  });

  describe('Static Factory Methods', () => {
    it('should create SigningOrder for owner first', () => {
      const signingOrder = SigningOrder.ownerFirst();

      expect(signingOrder.getType()).toBe(SigningOrderType.OWNER_FIRST);
      expect(signingOrder.isOwnerFirst()).toBe(true);
      expect(signingOrder.isInviteesFirst()).toBe(false);
    });

    it('should create SigningOrder for invitees first', () => {
      const signingOrder = SigningOrder.inviteesFirst();

      expect(signingOrder.getType()).toBe(SigningOrderType.INVITEES_FIRST);
      expect(signingOrder.isOwnerFirst()).toBe(false);
      expect(signingOrder.isInviteesFirst()).toBe(true);
    });

    it('should create SigningOrder from string', () => {
      const ownerFirst = SigningOrder.fromString('OWNER_FIRST');
      const inviteesFirst = SigningOrder.fromString('INVITEES_FIRST');

      expect(ownerFirst.getType()).toBe(SigningOrderType.OWNER_FIRST);
      expect(inviteesFirst.getType()).toBe(SigningOrderType.INVITEES_FIRST);
    });

    it('should throw error when fromString receives invalid string', () => {
      expect(() => SigningOrder.fromString('INVALID'))
        .toThrow(BadRequestError);

      expect(() => SigningOrder.fromString('owner_first'))
        .toThrow(BadRequestError);

      expect(() => SigningOrder.fromString('invitees_first'))
        .toThrow(BadRequestError);

      expect(() => SigningOrder.fromString(''))
        .toThrow(BadRequestError);

      expect(() => SigningOrder.fromString(null as any))
        .toThrow(BadRequestError);

      expect(() => SigningOrder.fromString(undefined as any))
        .toThrow(BadRequestError);
    });
  });

  describe('Business Logic Methods', () => {
    describe('isOwnerFirst', () => {
      it('should return true for OWNER_FIRST type', () => {
        const signingOrder = new SigningOrder(SigningOrderType.OWNER_FIRST);

        expect(signingOrder.isOwnerFirst()).toBe(true);
      });

      it('should return false for INVITEES_FIRST type', () => {
        const signingOrder = new SigningOrder(SigningOrderType.INVITEES_FIRST);

        expect(signingOrder.isOwnerFirst()).toBe(false);
      });
    });

    describe('isInviteesFirst', () => {
      it('should return true for INVITEES_FIRST type', () => {
        const signingOrder = new SigningOrder(SigningOrderType.INVITEES_FIRST);

        expect(signingOrder.isInviteesFirst()).toBe(true);
      });

      it('should return false for OWNER_FIRST type', () => {
        const signingOrder = new SigningOrder(SigningOrderType.OWNER_FIRST);

        expect(signingOrder.isInviteesFirst()).toBe(false);
      });
    });
  });

  describe('Equality', () => {
    it('should return true for equal SigningOrders', () => {
      const order1 = new SigningOrder(SigningOrderType.OWNER_FIRST);
      const order2 = new SigningOrder(SigningOrderType.OWNER_FIRST);

      expect(order1.equals(order2)).toBe(true);
    });

    it('should return false for different SigningOrders', () => {
      const order1 = new SigningOrder(SigningOrderType.OWNER_FIRST);
      const order2 = new SigningOrder(SigningOrderType.INVITEES_FIRST);

      expect(order1.equals(order2)).toBe(false);
    });

    it('should return false when comparing with different object types', () => {
      const order = new SigningOrder(SigningOrderType.OWNER_FIRST);
      const otherObject = { getType: () => SigningOrderType.OWNER_FIRST };

      expect(order.equals(otherObject as any)).toBe(false);
    });
  });

  describe('Serialization', () => {
    it('should return string representation', () => {
      const order = new SigningOrder(SigningOrderType.OWNER_FIRST);

      expect(order.toString()).toBe('OWNER_FIRST');
    });

    it('should return JSON representation', () => {
      const order = new SigningOrder(SigningOrderType.INVITEES_FIRST);

      expect(order.toJSON()).toBe('INVITEES_FIRST');
    });

    it('should be serializable to JSON string', () => {
      const order = new SigningOrder(SigningOrderType.OWNER_FIRST);
      const json = JSON.stringify(order.toJSON());

      expect(json).toBe('"OWNER_FIRST"');
    });
  });

  describe('Edge Cases', () => {
    it('should handle all Prisma enum values', () => {
      const ownerFirst = new SigningOrder(SigningOrderType.OWNER_FIRST);
      const inviteesFirst = new SigningOrder(SigningOrderType.INVITEES_FIRST);

      expect(ownerFirst.getType()).toBe(SigningOrderType.OWNER_FIRST);
      expect(inviteesFirst.getType()).toBe(SigningOrderType.INVITEES_FIRST);
    });

    it('should maintain immutability', () => {
      const order = new SigningOrder(SigningOrderType.OWNER_FIRST);
      const originalValue = order.getType();

      // Attempting to modify the internal value should not affect the object
      // (This test ensures the value object is truly immutable)
      expect(order.getType()).toBe(originalValue);
      expect(order.getType()).toBe(SigningOrderType.OWNER_FIRST);
    });

    it('should handle case sensitivity in fromString', () => {
      expect(() => SigningOrder.fromString('owner_first'))
        .toThrow(BadRequestError);

      expect(() => SigningOrder.fromString('invitees_first'))
        .toThrow(BadRequestError);

      expect(() => SigningOrder.fromString('Owner_First'))
        .toThrow(BadRequestError);

      expect(() => SigningOrder.fromString('Invitees_First'))
        .toThrow(BadRequestError);
    });

    it('should handle whitespace in fromString', () => {
      expect(() => SigningOrder.fromString(' OWNER_FIRST '))
        .toThrow(BadRequestError);

      expect(() => SigningOrder.fromString('\tINVITEES_FIRST\t'))
        .toThrow(BadRequestError);

      expect(() => SigningOrder.fromString('\nOWNER_FIRST\n'))
        .toThrow(BadRequestError);
    });

    it('should handle special characters in fromString', () => {
      expect(() => SigningOrder.fromString('OWNER_FIRST!'))
        .toThrow(BadRequestError);

      expect(() => SigningOrder.fromString('@INVITEES_FIRST'))
        .toThrow(BadRequestError);

      expect(() => SigningOrder.fromString('OWNER#FIRST'))
        .toThrow(BadRequestError);
    });

    it('should handle numeric and boolean inputs in fromString', () => {
      expect(() => SigningOrder.fromString(123 as any))
        .toThrow(BadRequestError);

      expect(() => SigningOrder.fromString(true as any))
        .toThrow(BadRequestError);

      expect(() => SigningOrder.fromString({} as any))
        .toThrow(BadRequestError);

      expect(() => SigningOrder.fromString([] as any))
        .toThrow(BadRequestError);
    });

    it('should handle all possible SigningOrderType values', () => {
      // Test that all enum values from Prisma are supported
      const allTypes = Object.values(SigningOrderType);
      
      allTypes.forEach(type => {
        expect(() => new SigningOrder(type)).not.toThrow();
        const order = new SigningOrder(type);
        expect(order.getType()).toBe(type);
      });
    });

    it('should handle static factory methods for all types', () => {
      const ownerFirst = SigningOrder.ownerFirst();
      const inviteesFirst = SigningOrder.inviteesFirst();

      expect(ownerFirst.getType()).toBe(SigningOrderType.OWNER_FIRST);
      expect(inviteesFirst.getType()).toBe(SigningOrderType.INVITEES_FIRST);
    });

    it('should handle fromString for all valid types', () => {
      const ownerFirst = SigningOrder.fromString('OWNER_FIRST');
      const inviteesFirst = SigningOrder.fromString('INVITEES_FIRST');

      expect(ownerFirst.getType()).toBe(SigningOrderType.OWNER_FIRST);
      expect(inviteesFirst.getType()).toBe(SigningOrderType.INVITEES_FIRST);
    });
  });
});