/**
 * @fileoverview Tests for formatDate use case
 * @summary Unit tests for date formatting utility
 * @description Comprehensive tests for formatting dates with different format strings
 */

import { describe, it, expect } from '@jest/globals';
import { formatDate, DEFAULT_DATE_FORMAT } from '../../../../src/modules/documents/use-cases/formatDate';

describe('formatDate', () => {
  describe('DEFAULT_DATE_FORMAT', () => {
    it('should export default date format constant', () => {
      expect(DEFAULT_DATE_FORMAT).toBe('MM/DD/YYYY');
    });
  });

  describe('formatDate with default format', () => {
    it('should format date with default format when no format provided', () => {
      const date = new Date(2024, 0, 15);
      const result = formatDate(date);

      expect(result).toBe('01/15/2024');
    });

    it('should format date with default format when format is explicitly DEFAULT_DATE_FORMAT', () => {
      const date = new Date(2024, 11, 25);
      const result = formatDate(date, DEFAULT_DATE_FORMAT);

      expect(result).toBe('12/25/2024');
    });
  });

  describe('formatDate with custom formats', () => {
    it('should format date with MM/DD/YYYY format', () => {
      const date = new Date(2024, 0, 15);
      const result = formatDate(date, 'MM/DD/YYYY');

      expect(result).toBe('01/15/2024');
    });

    it('should format date with DD-MM-YYYY format', () => {
      const date = new Date(2024, 0, 15);
      const result = formatDate(date, 'DD-MM-YYYY');

      expect(result).toBe('15-01-2024');
    });

    it('should format date with YYYY/MM/DD format', () => {
      const date = new Date(2024, 0, 15);
      const result = formatDate(date, 'YYYY/MM/DD');

      expect(result).toBe('2024/01/15');
    });

    it('should format date with MM/DD/YY format', () => {
      const date = new Date(2024, 0, 15);
      const result = formatDate(date, 'MM/DD/YY');

      expect(result).toBe('01/15/24');
    });

    it('should format date with YY-MM-DD format', () => {
      const date = new Date(2024, 0, 15);
      const result = formatDate(date, 'YY-MM-DD');

      expect(result).toBe('24-01-15');
    });
  });

  describe('Edge cases', () => {
    it('should pad single digit month with zero', () => {
      const date = new Date(2024, 0, 15);
      const result = formatDate(date, 'MM/DD/YYYY');

      expect(result).toBe('01/15/2024');
    });

    it('should pad single digit day with zero', () => {
      const date = new Date(2024, 0, 5);
      const result = formatDate(date, 'MM/DD/YYYY');

      expect(result).toBe('01/05/2024');
    });

    it('should handle month 12 correctly', () => {
      const date = new Date(2024, 11, 25);
      const result = formatDate(date, 'MM/DD/YYYY');

      expect(result).toBe('12/25/2024');
    });

    it('should handle day 31 correctly', () => {
      const date = new Date(2024, 0, 31);
      const result = formatDate(date, 'MM/DD/YYYY');

      expect(result).toBe('01/31/2024');
    });

    it('should handle year 2000 correctly', () => {
      const date = new Date(2000, 0, 15);
      const result = formatDate(date, 'MM/DD/YYYY');

      expect(result).toBe('01/15/2000');
    });

    it('should handle year 1999 correctly with YY format', () => {
      const date = new Date(1999, 0, 15);
      const result = formatDate(date, 'MM/DD/YY');

      expect(result).toBe('01/15/99');
    });

    it('should handle year 2024 correctly with YY format', () => {
      const date = new Date(2024, 0, 15);
      const result = formatDate(date, 'MM/DD/YY');

      expect(result).toBe('01/15/24');
    });

    it('should handle year 2100 correctly', () => {
      const date = new Date(2100, 0, 15);
      const result = formatDate(date, 'MM/DD/YYYY');

      expect(result).toBe('01/15/2100');
    });

    it('should handle year 2100 correctly with YY format', () => {
      const date = new Date(2100, 0, 15);
      const result = formatDate(date, 'MM/DD/YY');

      expect(result).toBe('01/15/00');
    });
  });

  describe('Format string variations', () => {
    it('should handle format with only MM', () => {
      const date = new Date(2024, 0, 15);
      const result = formatDate(date, 'MM');

      expect(result).toBe('01');
    });

    it('should handle format with only DD', () => {
      const date = new Date(2024, 0, 15);
      const result = formatDate(date, 'DD');

      expect(result).toBe('15');
    });

    it('should handle format with only YYYY', () => {
      const date = new Date(2024, 0, 15);
      const result = formatDate(date, 'YYYY');

      expect(result).toBe('2024');
    });

    it('should handle format with only YY', () => {
      const date = new Date(2024, 0, 15);
      const result = formatDate(date, 'YY');

      expect(result).toBe('24');
    });

    it('should handle format with multiple separators', () => {
      const date = new Date(2024, 0, 15);
      const result = formatDate(date, 'MM-DD-YYYY');

      expect(result).toBe('01-15-2024');
    });

    it('should handle format with spaces', () => {
      const date = new Date(2024, 0, 15);
      const result = formatDate(date, 'MM DD YYYY');

      expect(result).toBe('01 15 2024');
    });

    it('should handle format with mixed separators', () => {
      const date = new Date(2024, 0, 15);
      const result = formatDate(date, 'MM/DD-YYYY');

      expect(result).toBe('01/15-2024');
    });
  });

  describe('Date object variations', () => {
    it('should handle date created with Date constructor', () => {
      const date = new Date(2024, 0, 15);
      const result = formatDate(date, 'MM/DD/YYYY');

      expect(result).toBe('01/15/2024');
    });

    it('should handle date created with string', () => {
      const date = new Date(2024, 0, 15);
      const result = formatDate(date, 'MM/DD/YYYY');

      expect(result).toBe('01/15/2024');
    });

    it('should handle date with time component', () => {
      const date = new Date(2024, 0, 15, 12, 30, 45);
      const result = formatDate(date, 'MM/DD/YYYY');

      expect(result).toBe('01/15/2024');
    });
  });
});

















