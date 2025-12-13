/**
 * @fileoverview Tests for formatDate use case
 * @summary Unit tests for date formatting function
 */

import { describe, it, expect } from '@jest/globals';
import { formatDate, DEFAULT_DATE_FORMAT } from '../../../../src/modules/documents/use-cases/formatDate';

describe('formatDate', () => {
  describe('with default format', () => {
    it('should format date with default MM/DD/YYYY format', () => {
      const date = new Date(2024, 0, 15);
      const result = formatDate(date);
      expect(result).toBe('01/15/2024');
    });

    it('should pad single digit month and day', () => {
      const date = new Date(2024, 0, 5);
      const result = formatDate(date);
      expect(result).toBe('01/05/2024');
    });

    it('should handle double digit month and day', () => {
      const date = new Date(2024, 11, 25);
      const result = formatDate(date);
      expect(result).toBe('12/25/2024');
    });
  });

  describe('with custom format', () => {
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

    it('should format date with YYYY-MM-DD format', () => {
      const date = new Date(2024, 0, 15);
      const result = formatDate(date, 'YYYY-MM-DD');
      expect(result).toBe('2024-01-15');
    });

    it('should format date with MM/DD/YY format', () => {
      const date = new Date(2024, 0, 15);
      const result = formatDate(date, 'MM/DD/YY');
      expect(result).toBe('01/15/24');
    });

    it('should format date with YY format', () => {
      const date = new Date(2024, 0, 15);
      const result = formatDate(date, 'YY');
      expect(result).toBe('24');
    });

    it('should handle format with multiple placeholders', () => {
      const date = new Date(2024, 0, 15);
      const result = formatDate(date, 'MM/DD/YYYY HH:mm');
      expect(result).toBe('01/15/2024 HH:mm');
    });
  });

  describe('edge cases', () => {
    it('should handle year 2000', () => {
      const date = new Date(2000, 0, 1);
      const result = formatDate(date, 'MM/DD/YYYY');
      expect(result).toBe('01/01/2000');
    });

    it('should handle year 1999 with YY format', () => {
      const date = new Date(1999, 0, 1);
      const result = formatDate(date, 'MM/DD/YY');
      expect(result).toBe('01/01/99');
    });

    it('should handle leap year date', () => {
      const date = new Date(2024, 1, 29);
      const result = formatDate(date, 'MM/DD/YYYY');
      expect(result).toBe('02/29/2024');
    });

    it('should handle last day of month', () => {
      const date = new Date(2024, 0, 31);
      const result = formatDate(date, 'MM/DD/YYYY');
      expect(result).toBe('01/31/2024');
    });

    it('should handle first day of year', () => {
      const date = new Date(2024, 0, 1);
      const result = formatDate(date, 'MM/DD/YYYY');
      expect(result).toBe('01/01/2024');
    });

    it('should handle last day of year', () => {
      const date = new Date(2024, 11, 31);
      const result = formatDate(date, 'MM/DD/YYYY');
      expect(result).toBe('12/31/2024');
    });
  });
});

describe('DEFAULT_DATE_FORMAT', () => {
  it('should export default format constant', () => {
    expect(DEFAULT_DATE_FORMAT).toBe('MM/DD/YYYY');
  });
});
