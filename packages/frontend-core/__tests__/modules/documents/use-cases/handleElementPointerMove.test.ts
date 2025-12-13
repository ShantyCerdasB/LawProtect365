/**
 * @fileoverview Tests for handleElementPointerMove use case
 * @summary Unit tests for pointer move event handling
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { handleElementPointerMove } from '../../../../src/modules/documents/use-cases/handleElementPointerMove';
import { PdfElementType } from '../../../../src/modules/documents/enums';
import type { ElementInteractionContext } from '../../../../src/modules/documents/strategies/interfaces';

jest.mock('../../../../src/modules/documents/use-cases/createElementInteractionStrategy');

import { getElementInteractionStrategy } from '../../../../src/modules/documents/use-cases/createElementInteractionStrategy';

const mockGetElementInteractionStrategy = getElementInteractionStrategy as jest.MockedFunction<typeof getElementInteractionStrategy>;

describe('handleElementPointerMove', () => {
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

  it('should return null when no resize or drag state', () => {
    const input = {
      context: createContext(),
      displayPoint: { x: 100, y: 200 },
      resizeState: null,
      dragState: null,
    };

    const result = handleElementPointerMove(input);

    expect(result).toBeNull();
    expect(mockGetElementInteractionStrategy).not.toHaveBeenCalled();
  });

  it('should delegate to strategy when resize state exists', () => {
    const resizeState = {
      type: PdfElementType.Signature,
      index: 0,
      handle: 'southeast',
      startX: 100,
      startY: 200,
      startWidth: 150,
      startHeight: 60,
    };
    const interactionResult = { type: 'updateDimensions' as const, preventDefault: true };

    mockStrategy.handlePointerMove.mockReturnValue(interactionResult);

    const input = {
      context: createContext(),
      displayPoint: { x: 150, y: 250 },
      resizeState,
      dragState: null,
    };

    const result = handleElementPointerMove(input);

    expect(mockGetElementInteractionStrategy).toHaveBeenCalledWith(PdfElementType.Signature);
    expect(mockStrategy.handlePointerMove).toHaveBeenCalledWith(
      input.context,
      { x: 150, y: 250 },
      resizeState,
      null
    );
    expect(result).toEqual(interactionResult);
  });

  it('should delegate to strategy when drag state exists', () => {
    const dragState = {
      type: PdfElementType.Text,
      index: 0,
      offsetX: 10,
      offsetY: 20,
    };
    const interactionResult = { type: 'updateCoordinates' as const, preventDefault: true };

    mockStrategy.handlePointerMove.mockReturnValue(interactionResult);

    const input = {
      context: createContext(),
      displayPoint: { x: 200, y: 300 },
      resizeState: null,
      dragState,
    };

    const result = handleElementPointerMove(input);

    expect(mockGetElementInteractionStrategy).toHaveBeenCalledWith(PdfElementType.Text);
    expect(mockStrategy.handlePointerMove).toHaveBeenCalledWith(
      input.context,
      { x: 200, y: 300 },
      null,
      dragState
    );
    expect(result).toEqual(interactionResult);
  });

  it('should prioritize resize state over drag state', () => {
    const resizeState = {
      type: PdfElementType.Signature,
      index: 0,
      handle: 'southeast',
      startX: 100,
      startY: 200,
      startWidth: 150,
      startHeight: 60,
    };
    const dragState = {
      type: PdfElementType.Text,
      index: 0,
      offsetX: 10,
      offsetY: 20,
    };

    mockStrategy.handlePointerMove.mockReturnValue({ type: 'updateDimensions' as const, preventDefault: true });

    const input = {
      context: createContext(),
      displayPoint: { x: 150, y: 250 },
      resizeState,
      dragState,
    };

    handleElementPointerMove(input);

    expect(mockGetElementInteractionStrategy).toHaveBeenCalledWith(PdfElementType.Signature);
    expect(mockGetElementInteractionStrategy).not.toHaveBeenCalledWith(PdfElementType.Text);
    expect(mockStrategy.handlePointerMove).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      resizeState,
      dragState
    );
  });

  it('should return null when strategy is not found', () => {
    const resizeState = {
      type: PdfElementType.Signature,
      index: 0,
      handle: 'southeast',
      startX: 100,
      startY: 200,
      startWidth: 150,
      startHeight: 60,
    };

    mockGetElementInteractionStrategy.mockReturnValue(null);

    const input = {
      context: createContext(),
      displayPoint: { x: 150, y: 250 },
      resizeState,
      dragState: null,
    };

    const result = handleElementPointerMove(input);

    expect(result).toBeNull();
  });
});
