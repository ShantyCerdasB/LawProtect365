/**
 * @fileoverview PatchMeSchema Tests - Unit tests for PatchMeSchema
 * @summary Tests for PATCH /me request validation schema
 * @description Tests validation schemas for user profile update requests including personal info validation.
 */

import { describe, it, expect } from '@jest/globals';
import { PatchMeBodySchema } from '../../../src/domain/schemas/PatchMeSchema';

describe('PatchMeBodySchema', () => {
  describe('basic fields', () => {
    it('should validate request with name only', () => {
      const result = PatchMeBodySchema.safeParse({ name: 'John Doe' });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('John Doe');
      }
    });

    it('should validate request with givenName only', () => {
      const result = PatchMeBodySchema.safeParse({ givenName: 'John' });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.givenName).toBe('John');
      }
    });

    it('should validate request with lastName only', () => {
      const result = PatchMeBodySchema.safeParse({ lastName: 'Doe' });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.lastName).toBe('Doe');
      }
    });

    it('should trim whitespace from name fields', () => {
      const result = PatchMeBodySchema.safeParse({ name: '  John Doe  ' });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('John Doe');
      }
    });

    it('should reject empty request', () => {
      const result = PatchMeBodySchema.safeParse({});

      expect(result.success).toBe(false);
    });
  });

  describe('personalInfo', () => {
    it('should validate personalInfo with phone', () => {
      const result = PatchMeBodySchema.safeParse({
        name: 'John Doe',
        personalInfo: {
          phone: '+1234567890'
        }
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.personalInfo?.phone).toBe('+1234567890');
      }
    });

    it('should validate personalInfo with locale', () => {
      const result = PatchMeBodySchema.safeParse({
        name: 'John Doe',
        personalInfo: {
          locale: 'es-CR'
        }
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.personalInfo?.locale).toBe('es-CR');
      }
    });

    it('should validate personalInfo with timeZone', () => {
      const result = PatchMeBodySchema.safeParse({
        name: 'John Doe',
        personalInfo: {
          timeZone: 'America/Costa_Rica'
        }
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.personalInfo?.timeZone).toBe('America/Costa_Rica');
      }
    });

    it('should validate personalInfo with all fields', () => {
      const result = PatchMeBodySchema.safeParse({
        name: 'John Doe',
        personalInfo: {
          phone: '+1234567890',
          locale: 'es-CR',
          timeZone: 'America/Costa_Rica'
        }
      });

      expect(result.success).toBe(true);
    });

    it('should reject invalid phone format', () => {
      const result = PatchMeBodySchema.safeParse({
        name: 'John Doe',
        personalInfo: {
          phone: '1234567890'
        }
      });

      expect(result.success).toBe(false);
    });

    it('should reject invalid locale format', () => {
      const result = PatchMeBodySchema.safeParse({
        name: 'John Doe',
        personalInfo: {
          locale: 'invalid'
        }
      });

      expect(result.success).toBe(false);
    });

    it('should reject invalid timeZone format', () => {
      const result = PatchMeBodySchema.safeParse({
        name: 'John Doe',
        personalInfo: {
          timeZone: 'invalid'
        }
      });

      expect(result.success).toBe(false);
    });

    it('should transform null phone to undefined', () => {
      const result = PatchMeBodySchema.safeParse({
        name: 'John Doe',
        personalInfo: {
          phone: null
        }
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.personalInfo?.phone).toBeUndefined();
      }
    });


    it('should transform null locale to undefined', () => {
      const result = PatchMeBodySchema.safeParse({
        name: 'John Doe',
        personalInfo: {
          locale: null
        }
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.personalInfo?.locale).toBeUndefined();
      }
    });

    it('should transform null timeZone to undefined', () => {
      const result = PatchMeBodySchema.safeParse({
        name: 'John Doe',
        personalInfo: {
          timeZone: null
        }
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.personalInfo?.timeZone).toBeUndefined();
      }
    });

    it('should validate phone with E.164 format', () => {
      const validPhones = ['+1234567890', '+44123456789', '+34612345678'];
      
      validPhones.forEach(phone => {
        const result = PatchMeBodySchema.safeParse({
          name: 'John Doe',
          personalInfo: { phone }
        });
        expect(result.success).toBe(true);
      });
    });

    it('should validate locale with BCP47 format', () => {
      const validLocales = ['en-US', 'es-CR', 'fr-FR', 'de-DE'];
      
      validLocales.forEach(locale => {
        const result = PatchMeBodySchema.safeParse({
          name: 'John Doe',
          personalInfo: { locale }
        });
        expect(result.success).toBe(true);
      });
    });

    it('should validate timeZone with IANA format', () => {
      const validTimeZones = ['America/Costa_Rica', 'America/New_York', 'Europe/London', 'Asia/Tokyo'];
      
      validTimeZones.forEach(timeZone => {
        const result = PatchMeBodySchema.safeParse({
          name: 'John Doe',
          personalInfo: { timeZone }
        });
        expect(result.success).toBe(true);
      });
    });
  });

  describe('combined updates', () => {
    it('should validate request with name and personalInfo', () => {
      const result = PatchMeBodySchema.safeParse({
        name: 'John Doe',
        personalInfo: {
          phone: '+1234567890'
        }
      });

      expect(result.success).toBe(true);
    });

    it('should validate request with all fields', () => {
      const result = PatchMeBodySchema.safeParse({
        name: 'John Doe',
        givenName: 'John',
        lastName: 'Doe',
        personalInfo: {
          phone: '+1234567890',
          locale: 'es-CR',
          timeZone: 'America/Costa_Rica'
        }
      });

      expect(result.success).toBe(true);
    });
  });
});

