/**
 * @fileoverview Handler Constants Tests
 * @summary Tests for handler constants
 */

import {
  PENDING_ELEMENT_INDEX,
  DEFAULT_COORDINATES,
  DEFAULT_EVENT_COORDINATES,
} from '@/modules/documents/handlers/constants/HandlerConstants';

describe('HandlerConstants', () => {
  describe('PENDING_ELEMENT_INDEX', () => {
    it('should have correct pending element index value', () => {
      expect(PENDING_ELEMENT_INDEX).toBe(-1);
    });

    it('should be a number', () => {
      expect(typeof PENDING_ELEMENT_INDEX).toBe('number');
    });
  });

  describe('DEFAULT_COORDINATES', () => {
    it('should have correct default x coordinate', () => {
      expect(DEFAULT_COORDINATES.x).toBe(0);
    });

    it('should have correct default y coordinate', () => {
      expect(DEFAULT_COORDINATES.y).toBe(0);
    });

    it('should have x and y properties', () => {
      expect(DEFAULT_COORDINATES).toHaveProperty('x');
      expect(DEFAULT_COORDINATES).toHaveProperty('y');
    });

    it('should be a readonly object', () => {
      expect(Object.isFrozen(DEFAULT_COORDINATES)).toBe(true);
    });
  });

  describe('DEFAULT_EVENT_COORDINATES', () => {
    it('should have correct default clientX coordinate', () => {
      expect(DEFAULT_EVENT_COORDINATES.clientX).toBe(0);
    });

    it('should have correct default clientY coordinate', () => {
      expect(DEFAULT_EVENT_COORDINATES.clientY).toBe(0);
    });

    it('should have clientX and clientY properties', () => {
      expect(DEFAULT_EVENT_COORDINATES).toHaveProperty('clientX');
      expect(DEFAULT_EVENT_COORDINATES).toHaveProperty('clientY');
    });

    it('should be a readonly object', () => {
      expect(Object.isFrozen(DEFAULT_EVENT_COORDINATES)).toBe(true);
    });
  });
});




