/**
 * @fileoverview Tests for DateInteractionStrategy
 * @summary Unit tests for date element interaction strategy
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { DateInteractionStrategy } from '../../../../src/modules/documents/strategies/DateInteractionStrategy';
import { PdfElementType } from '../../../../src/modules/documents/enums';
import type { ElementInteractionContext } from '../../../../src/modules/documents/strategies/interfaces';

describe('DateInteractionStrategy', () => {
  let strategy: DateInteractionStrategy;

  beforeEach(() => {
    strategy = new DateInteractionStrategy();
  });

  describe('canHandle', () => {
    it('should handle PdfElementType.Date', () => {
      expect(strategy.canHandle(PdfElementType.Date)).toBe(true);
    });

    it('should handle date string literal', () => {
      expect(strategy.canHandle('date')).toBe(true);
    });

    it('should not handle other element types', () => {
      expect(strategy.canHandle(PdfElementType.Signature)).toBe(false);
      expect(strategy.canHandle(PdfElementType.Text)).toBe(false);
      expect(strategy.canHandle(null)).toBe(false);
    });
  });

  describe('getElementType', () => {
    it('should return Date element type', () => {
      expect(strategy.canHandle(PdfElementType.Date)).toBe(true);
    });
  });

  describe('strategy instantiation', () => {
    it('should create strategy instance', () => {
      expect(strategy).toBeInstanceOf(DateInteractionStrategy);
    });
  });
});
