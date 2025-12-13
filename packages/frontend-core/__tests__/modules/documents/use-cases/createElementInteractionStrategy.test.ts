/**
 * @fileoverview Tests for createElementInteractionStrategy use case
 * @summary Unit tests for element interaction strategy factory
 */

import { describe, it, expect } from '@jest/globals';
import {
  getElementInteractionStrategy,
  getAllElementInteractionStrategies,
} from '../../../../src/modules/documents/use-cases/createElementInteractionStrategy';
import { PdfElementType } from '../../../../src/modules/documents/enums';

describe('getElementInteractionStrategy', () => {
  it('should return TextInteractionStrategy for Text element type', () => {
    const strategy = getElementInteractionStrategy(PdfElementType.Text);

    expect(strategy).not.toBeNull();
    expect(strategy?.canHandle(PdfElementType.Text)).toBe(true);
  });

  it('should return DateInteractionStrategy for Date element type', () => {
    const strategy = getElementInteractionStrategy(PdfElementType.Date);

    expect(strategy).not.toBeNull();
    expect(strategy?.canHandle(PdfElementType.Date)).toBe(true);
  });

  it('should return SignatureInteractionStrategy for Signature element type', () => {
    const strategy = getElementInteractionStrategy(PdfElementType.Signature);

    expect(strategy).not.toBeNull();
    expect(strategy?.canHandle(PdfElementType.Signature)).toBe(true);
  });

  it('should return strategy for text string literal', () => {
    const strategy = getElementInteractionStrategy('text');

    expect(strategy).not.toBeNull();
    expect(strategy?.canHandle('text')).toBe(true);
  });

  it('should return strategy for date string literal', () => {
    const strategy = getElementInteractionStrategy('date');

    expect(strategy).not.toBeNull();
    expect(strategy?.canHandle('date')).toBe(true);
  });

  it('should return null for unknown element type', () => {
    const strategy = getElementInteractionStrategy('unknown' as PdfElementType);

    expect(strategy).toBeNull();
  });

  it('should return null for null element type', () => {
    const strategy = getElementInteractionStrategy(null);

    expect(strategy).toBeNull();
  });
});

describe('getAllElementInteractionStrategies', () => {
  it('should return all registered strategies', () => {
    const strategies = getAllElementInteractionStrategies();

    expect(strategies).toHaveLength(3);
    expect(strategies.some((s) => s.canHandle(PdfElementType.Text))).toBe(true);
    expect(strategies.some((s) => s.canHandle(PdfElementType.Date))).toBe(true);
    expect(strategies.some((s) => s.canHandle(PdfElementType.Signature))).toBe(true);
  });

  it('should return same instance on multiple calls', () => {
    const strategies1 = getAllElementInteractionStrategies();
    const strategies2 = getAllElementInteractionStrategies();

    expect(strategies1).toBe(strategies2);
  });
});
