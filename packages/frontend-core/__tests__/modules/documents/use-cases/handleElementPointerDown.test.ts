/**
 * @fileoverview Tests for handleElementPointerDown use case
 * @summary Unit tests for pointer down event handling
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { handleElementPointerDown } from '../../../../src/modules/documents/use-cases/handleElementPointerDown';
import { PdfElementType } from '../../../../src/modules/documents/enums';
import type { ElementInteractionContext } from '../../../../src/modules/documents/strategies/interfaces';

jest.mock('../../../../src/modules/documents/use-cases/detectElementInteraction');
jest.mock('../../../../src/modules/documents/use-cases/createElementInteractionStrategy');

import { detectControlAtPoint } from '../../../../src/modules/documents/use-cases/detectElementInteraction';
import { getElementInteractionStrategy } from '../../../../src/modules/documents/use-cases/createElementInteractionStrategy';

const mockDetectControlAtPoint = detectControlAtPoint as jest.MockedFunction<typeof detectControlAtPoint>;
const mockGetElementInteractionStrategy = getElementInteractionStrategy as jest.MockedFunction<typeof getElementInteractionStrategy>;

describe('handleElementPointerDown', () => {
  const createContext = (): ElementInteractionContext => ({
    currentPage: 1,
    renderMetrics: {
      pdfPageWidth: 612,
      pdfPageHeight: 792,
      viewportWidth: 1024,
      viewportHeight: 1320,
    },
    signatures: [],
    texts: [],
    dates: [],
    elements: { signatures: [], texts: [], dates: [] },
    pendingCoordinates: null,
    pendingElementType: null,
    pendingSignatureWidth: 150,
    pendingSignatureHeight: 60,
  });

  const mockStrategy = {
    handlePointerDown: jest.fn(),
    handlePointerMove: jest.fn(),
    handlePointerUp: jest.fn(),
    canHandle: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetElementInteractionStrategy.mockReturnValue(mockStrategy as never);
  });

  it('should return null result when no element hit and no pending element', () => {
    mockDetectControlAtPoint.mockReturnValue({
      elementHit: null,
      controlHit: null,
      elementBounds: null,
    });

    const input = {
      context: createContext(),
      displayPoint: { x: 100, y: 200 },
    };

    const result = handleElementPointerDown(input);

    expect(result.result).toBeNull();
    expect(result.elementHit).toBeNull();
    expect(result.controlHit).toBeNull();
    expect(result.elementBounds).toBeNull();
  });

  it('should delegate to strategy when element is hit', () => {
    const elementHit = { type: PdfElementType.Signature, index: 0 };
    const controlHit = null;
    const elementBounds = { x: 100, y: 200, width: 150, height: 60 };
    const interactionResult = { type: 'startDrag' as const, preventDefault: true };

    mockDetectControlAtPoint.mockReturnValue({
      elementHit,
      controlHit,
      elementBounds,
    });
    mockStrategy.handlePointerDown.mockReturnValue(interactionResult);

    const context = createContext();
    const input = {
      context,
      displayPoint: { x: 100, y: 200 },
    };

    const result = handleElementPointerDown(input);

    expect(mockGetElementInteractionStrategy).toHaveBeenCalledWith(PdfElementType.Signature);
    expect(mockStrategy.handlePointerDown).toHaveBeenCalledWith(
      context,
      { x: 100, y: 200 },
      elementHit,
      controlHit,
      elementBounds
    );
    expect(result.result).toEqual(interactionResult);
    expect(result.elementHit).toEqual(elementHit);
    expect(result.controlHit).toEqual(controlHit);
    expect(result.elementBounds).toEqual(elementBounds);
  });

  it('should use pending element type when no element is hit', () => {
    const context = createContext();
    context.pendingElementType = PdfElementType.Text;

    mockDetectControlAtPoint.mockReturnValue({
      elementHit: null,
      controlHit: null,
      elementBounds: null,
    });
    mockStrategy.handlePointerDown.mockReturnValue({ type: 'startDrag' as const, preventDefault: true });

    const input = {
      context,
      displayPoint: { x: 100, y: 200 },
    };

    const result = handleElementPointerDown(input);

    expect(mockGetElementInteractionStrategy).toHaveBeenCalledWith(PdfElementType.Text);
    expect(result.result).not.toBeNull();
  });

  it('should prioritize element hit over pending element type', () => {
    const elementHit = { type: PdfElementType.Signature, index: 0 };
    const context = createContext();
    context.pendingElementType = PdfElementType.Text;

    mockDetectControlAtPoint.mockReturnValue({
      elementHit,
      controlHit: null,
      elementBounds: { x: 100, y: 200, width: 150, height: 60 },
    });
    mockStrategy.handlePointerDown.mockReturnValue({ type: 'startDrag' as const, preventDefault: true });

    const input = {
      context,
      displayPoint: { x: 100, y: 200 },
    };

    handleElementPointerDown(input);

    expect(mockGetElementInteractionStrategy).toHaveBeenCalledWith(PdfElementType.Signature);
    expect(mockGetElementInteractionStrategy).not.toHaveBeenCalledWith(PdfElementType.Text);
  });

  it('should return null when strategy is not found', () => {
    mockDetectControlAtPoint.mockReturnValue({
      elementHit: { type: PdfElementType.Signature, index: 0 },
      controlHit: null,
      elementBounds: { x: 100, y: 200, width: 150, height: 60 },
    });
    mockGetElementInteractionStrategy.mockReturnValue(null);

    const input = {
      context: createContext(),
      displayPoint: { x: 100, y: 200 },
    };

    const result = handleElementPointerDown(input);

    expect(result.result).toBeNull();
  });

  it('should handle control hit', () => {
    const elementHit = { type: PdfElementType.Text, index: 0 };
    const controlHit = { type: 'delete' };
    const elementBounds = { x: 100, y: 200, width: 50, height: 12 };
    const interactionResult = { type: 'delete' as const, preventDefault: true };

    mockDetectControlAtPoint.mockReturnValue({
      elementHit,
      controlHit,
      elementBounds,
    });
    mockStrategy.handlePointerDown.mockReturnValue(interactionResult);

    const input = {
      context: createContext(),
      displayPoint: { x: 200, y: 188 },
    };

    const result = handleElementPointerDown(input);

    expect(result.controlHit).toEqual(controlHit);
    expect(result.result).toEqual(interactionResult);
  });
});
