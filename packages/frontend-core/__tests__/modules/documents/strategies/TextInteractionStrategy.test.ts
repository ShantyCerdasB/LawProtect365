/**
 * @fileoverview Tests for TextInteractionStrategy
 * @summary Unit tests for text element interaction strategy
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { TextInteractionStrategy } from '../../../../src/modules/documents/strategies/TextInteractionStrategy';
import { PdfElementType } from '../../../../src/modules/documents/enums';

describe('TextInteractionStrategy', () => {
  let strategy: TextInteractionStrategy;

  beforeEach(() => {
    strategy = new TextInteractionStrategy();
  });

  describe('canHandle', () => {
    it('should handle PdfElementType.Text', () => {
      expect(strategy.canHandle(PdfElementType.Text)).toBe(true);
    });

    it('should handle text string literal', () => {
      expect(strategy.canHandle('text')).toBe(true);
    });

    it('should not handle other element types', () => {
      expect(strategy.canHandle(PdfElementType.Signature)).toBe(false);
      expect(strategy.canHandle(PdfElementType.Date)).toBe(false);
      expect(strategy.canHandle(null)).toBe(false);
    });
  });

  describe('strategy instantiation', () => {
    it('should create strategy instance', () => {
      expect(strategy).toBeInstanceOf(TextInteractionStrategy);
    });
  });
});
