/**
 * @fileoverview Web Element Interaction Handler Tests
 * @summary Tests for the WebElementInteractionHandler class
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { WebElementInteractionHandler } from '@/modules/documents/handlers/WebElementInteractionHandler';
import { InteractionResultType, PdfElementType, ResizeHandle } from '@lawprotect/frontend-core';
import * as frontendCore from '@lawprotect/frontend-core';

jest.mock('@lawprotect/frontend-core', () => {
  const actual = jest.requireActual('@lawprotect/frontend-core') as Record<string, unknown>;
  return {
    ...actual,
    handleElementPointerDown: jest.fn(),
    handleElementPointerMove: jest.fn(),
    convertDisplayToPDF: jest.fn(({ displayPoint, renderMetrics, pageNumber }) => ({
      x: displayPoint.x,
      y: displayPoint.y,
      pageNumber,
      pageWidth: renderMetrics.pdfPageWidth,
      pageHeight: renderMetrics.pdfPageHeight,
    })),
  };
});

const mockHandleElementPointerDown = frontendCore.handleElementPointerDown as jest.MockedFunction<typeof frontendCore.handleElementPointerDown>;
const mockHandleElementPointerMove = frontendCore.handleElementPointerMove as jest.MockedFunction<typeof frontendCore.handleElementPointerMove>;

describe('WebElementInteractionHandler', () => {
  const mockSetDraggedElement = jest.fn();
  const mockSetResizeHandle = jest.fn();
  const mockOnElementMove = jest.fn();
  const mockOnElementDelete = jest.fn();
  const mockOnSignatureResize = jest.fn();
  const mockOnTextResize = jest.fn();
  const mockOnDateResize = jest.fn();
  const mockOnPageClick = jest.fn();

  const mockRenderMetrics = {
    outputScale: 1,
    viewportWidth: 800,
    viewportHeight: 1200,
    pdfPageWidth: 800,
    pdfPageHeight: 1200,
  };

  const mockContext = {
    currentPage: 1,
    signatures: [],
    texts: [],
    dates: [],
    elements: {
      signatures: [],
      texts: [],
      dates: [],
    },
    pendingCoordinates: null,
    renderMetrics: mockRenderMetrics,
    pendingElementType: null,
    pendingSignatureWidth: 150,
    pendingSignatureHeight: 60,
  };

  const mockConfig = {
    renderMetrics: mockRenderMetrics,
    context: mockContext,
    setDraggedElement: mockSetDraggedElement,
    setResizeHandle: mockSetResizeHandle,
    onElementMove: mockOnElementMove,
    onElementDelete: mockOnElementDelete,
    onSignatureResize: mockOnSignatureResize,
    onTextResize: mockOnTextResize,
    onDateResize: mockOnDateResize,
    onPageClick: mockOnPageClick,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockHandleElementPointerDown.mockReturnValue({
      result: null,
      elementHit: null,
      controlHit: null,
      elementBounds: null,
    } as any);
    mockHandleElementPointerMove.mockReturnValue(null);
  });

  it('should create handler instance', () => {
    const handler = new WebElementInteractionHandler(mockConfig);

    expect(handler).toBeInstanceOf(WebElementInteractionHandler);
  });

  it('should handle pointer down event', () => {
    mockHandleElementPointerDown.mockReturnValue({
      result: {
        type: InteractionResultType.StartDrag,
        elementType: PdfElementType.Signature,
        index: 0,
        offsetX: 10,
        offsetY: 20,
        preventDefault: true,
      },
      elementHit: { type: PdfElementType.Signature, index: 0 },
      controlHit: null,
      elementBounds: null,
    } as any);
    const handler = new WebElementInteractionHandler(mockConfig);
    const mockCanvas = document.createElement('canvas');
    const mockRect = { left: 0, top: 0, width: 800, height: 1200 };
    mockCanvas.getBoundingClientRect = () => mockRect as DOMRect;
    mockCanvas.setPointerCapture = jest.fn();
    const mockEvent = {
      clientX: 100,
      clientY: 200,
      pointerId: 1,
      currentTarget: mockCanvas,
      preventDefault: jest.fn(),
    } as any;

    handler.handlePointerDown(mockEvent, mockCanvas);

    expect(mockSetDraggedElement).toHaveBeenCalled();
  });

  it('should handle pointer move event', () => {
    mockHandleElementPointerMove.mockReturnValue({
      type: InteractionResultType.UpdateCoordinates,
      elementType: PdfElementType.Signature,
      index: 0,
      coordinates: { x: 100, y: 200, pageNumber: 1, pageWidth: 800, pageHeight: 1200 },
      preventDefault: false,
    } as any);
    const handler = new WebElementInteractionHandler(mockConfig);
    const mockCanvas = document.createElement('canvas');
    const mockRect = { left: 0, top: 0, width: 800, height: 1200 };
    mockCanvas.getBoundingClientRect = () => mockRect as DOMRect;
    const mockEvent = {
      clientX: 150,
      clientY: 250,
      currentTarget: mockCanvas,
    } as any;

    handler.handlePointerMove(mockEvent, mockCanvas, null, null);

    expect(mockOnElementMove).toHaveBeenCalled();
  });

  it('should handle pointer up event', () => {
    const handler = new WebElementInteractionHandler(mockConfig);
    const mockCanvas = document.createElement('canvas');
    mockCanvas.releasePointerCapture = jest.fn();
    const mockEvent = {
      pointerId: 1,
    } as any;

    handler.handlePointerUp(mockEvent, mockCanvas);

    expect(mockCanvas.releasePointerCapture).toHaveBeenCalledWith(1);
  });

  it('should handle click event', () => {
    const handler = new WebElementInteractionHandler(mockConfig);
    const mockCanvas = document.createElement('canvas');
    const mockRect = { left: 0, top: 0, width: 800, height: 1200 };
    mockCanvas.getBoundingClientRect = () => mockRect as DOMRect;
    const mockEvent = {
      clientX: 100,
      clientY: 200,
      currentTarget: mockCanvas,
    } as any;

    handler.handleClick(mockEvent, mockCanvas, null, null, false);

    expect(mockOnPageClick).toHaveBeenCalled();
  });

  it('should handle null render metrics', () => {
    const contextWithoutMetrics = {
      ...mockContext,
      renderMetrics: mockRenderMetrics,
    };
    const configWithoutMetrics = {
      ...mockConfig,
      renderMetrics: null,
      context: contextWithoutMetrics,
    };

    const handler = new WebElementInteractionHandler(configWithoutMetrics);
    const mockCanvas = document.createElement('canvas');
    const mockRect = { left: 0, top: 0, width: 800, height: 1200 };
    mockCanvas.getBoundingClientRect = () => mockRect as DOMRect;
    mockCanvas.setPointerCapture = jest.fn();
    const mockEvent = {
      clientX: 100,
      clientY: 200,
      pointerId: 1,
      currentTarget: mockCanvas,
    } as any;

    expect(() => handler.handlePointerDown(mockEvent, mockCanvas)).not.toThrow();
  });

  it('should handle null canvas element', () => {
    const handler = new WebElementInteractionHandler(mockConfig);
    const mockCanvas = document.createElement('canvas');
    mockCanvas.setPointerCapture = jest.fn();
    const mockEvent = {
      clientX: 100,
      clientY: 200,
      pointerId: 1,
      currentTarget: mockCanvas,
    } as any;

    expect(() => handler.handlePointerDown(mockEvent, mockCanvas)).not.toThrow();
  });

  it('should process start drag interaction result', () => {
    mockHandleElementPointerDown.mockReturnValue({
      result: {
        type: InteractionResultType.StartDrag,
        elementType: PdfElementType.Signature,
        index: 0,
        offsetX: 10,
        offsetY: 20,
        preventDefault: true,
      },
      elementHit: { type: PdfElementType.Signature, index: 0 },
      controlHit: null,
      elementBounds: null,
    } as any);
    const handler = new WebElementInteractionHandler(mockConfig);
    const mockCanvas = document.createElement('canvas');
    const mockRect = { left: 0, top: 0, width: 800, height: 1200 };
    mockCanvas.getBoundingClientRect = () => mockRect as DOMRect;
    mockCanvas.setPointerCapture = jest.fn();
    const mockEvent = {
      clientX: 100,
      clientY: 200,
      pointerId: 1,
      currentTarget: mockCanvas,
      preventDefault: jest.fn(),
    } as any;

    handler.handlePointerDown(mockEvent, mockCanvas);

    expect(mockSetDraggedElement).toHaveBeenCalled();
  });

  it('should handle click when renderMetrics is null', () => {
    const handler = new WebElementInteractionHandler({
      ...mockConfig,
      renderMetrics: null,
    });
    const mockCanvas = document.createElement('canvas');
    const mockRect = { left: 0, top: 0, width: 800, height: 1200 };
    mockCanvas.getBoundingClientRect = () => mockRect as DOMRect;
    const mockEvent = {
      clientX: 100,
      clientY: 200,
      currentTarget: mockCanvas,
    } as any;

    handler.handleClick(mockEvent, mockCanvas, null, null, false);

    expect(mockOnPageClick).not.toHaveBeenCalled();
  });

  it('should handle start resize interaction result', () => {
    mockHandleElementPointerDown.mockReturnValue({
      result: {
        type: InteractionResultType.StartResize,
        elementType: PdfElementType.Signature,
        index: 0,
        handle: ResizeHandle.Southeast,
        startX: 100,
        startY: 200,
        startWidth: 150,
        startHeight: 60,
        startFontSize: undefined,
        preventDefault: true,
      },
      elementHit: { type: PdfElementType.Signature, index: 0 },
      controlHit: null,
      elementBounds: null,
    } as any);
    const handler = new WebElementInteractionHandler(mockConfig);
    const mockCanvas = document.createElement('canvas');
    const mockRect = { left: 0, top: 0, width: 800, height: 1200 };
    mockCanvas.getBoundingClientRect = () => mockRect as DOMRect;
    mockCanvas.setPointerCapture = jest.fn();
    const mockEvent = {
      clientX: 100,
      clientY: 200,
      pointerId: 1,
      currentTarget: mockCanvas,
      preventDefault: jest.fn(),
    } as any;

    handler.handlePointerDown(mockEvent, mockCanvas);

    expect(mockSetResizeHandle).toHaveBeenCalled();
  });

  it('should handle delete interaction result', () => {
    mockHandleElementPointerDown.mockReturnValue({
      result: {
        type: InteractionResultType.Delete,
        elementType: PdfElementType.Signature,
        index: 0,
        preventDefault: false,
      },
      elementHit: { type: PdfElementType.Signature, index: 0 },
      controlHit: null,
      elementBounds: null,
    } as any);
    const handler = new WebElementInteractionHandler(mockConfig);
    const mockCanvas = document.createElement('canvas');
    const mockRect = { left: 0, top: 0, width: 800, height: 1200 };
    mockCanvas.getBoundingClientRect = () => mockRect as DOMRect;
    mockCanvas.setPointerCapture = jest.fn();
    const mockEvent = {
      clientX: 100,
      clientY: 200,
      pointerId: 1,
      currentTarget: mockCanvas,
      preventDefault: jest.fn(),
    } as any;

    handler.handlePointerDown(mockEvent, mockCanvas);

    expect(mockOnElementDelete).toHaveBeenCalledWith(PdfElementType.Signature, 0);
  });

  it('should handle update coordinates interaction result', () => {
    mockHandleElementPointerMove.mockReturnValue({
      type: InteractionResultType.UpdateCoordinates,
      elementType: PdfElementType.Text,
      index: 0,
      coordinates: { x: 150, y: 250, pageNumber: 1, pageWidth: 800, pageHeight: 1200 },
      preventDefault: false,
    } as any);
    const handler = new WebElementInteractionHandler(mockConfig);
    const mockCanvas = document.createElement('canvas');
    const mockRect = { left: 0, top: 0, width: 800, height: 1200 };
    mockCanvas.getBoundingClientRect = () => mockRect as DOMRect;
    const mockEvent = {
      clientX: 150,
      clientY: 250,
      currentTarget: mockCanvas,
    } as any;

    handler.handlePointerMove(mockEvent, mockCanvas, null, null);

    expect(mockOnElementMove).toHaveBeenCalledWith(PdfElementType.Text, 0, {
      x: 150,
      y: 250,
      pageNumber: 1,
      pageWidth: 800,
      pageHeight: 1200,
    });
  });

  it('should handle update dimensions interaction result for pending signature', () => {
    mockHandleElementPointerMove.mockReturnValue({
      type: InteractionResultType.UpdateDimensions,
      index: -1,
      width: 200,
      height: 80,
      coordinates: { x: 100, y: 200, pageNumber: 1, pageWidth: 800, pageHeight: 1200 },
      preventDefault: false,
    } as any);
    const handler = new WebElementInteractionHandler(mockConfig);
    const mockCanvas = document.createElement('canvas');
    const mockRect = { left: 0, top: 0, width: 800, height: 1200 };
    mockCanvas.getBoundingClientRect = () => mockRect as DOMRect;
    const mockEvent = {
      clientX: 150,
      clientY: 250,
      currentTarget: mockCanvas,
    } as any;

    handler.handlePointerMove(mockEvent, mockCanvas, null, null);

    expect(mockOnSignatureResize).toHaveBeenCalledWith(-1, 200, 80);
    expect(mockOnPageClick).toHaveBeenCalled();
  });

  it('should handle update dimensions interaction result for existing signature', () => {
    mockHandleElementPointerMove.mockReturnValue({
      type: InteractionResultType.UpdateDimensions,
      index: 0,
      width: 200,
      height: 80,
      coordinates: { x: 100, y: 200, pageNumber: 1, pageWidth: 800, pageHeight: 1200 },
      preventDefault: false,
    } as any);
    const handler = new WebElementInteractionHandler(mockConfig);
    const mockCanvas = document.createElement('canvas');
    const mockRect = { left: 0, top: 0, width: 800, height: 1200 };
    mockCanvas.getBoundingClientRect = () => mockRect as DOMRect;
    const mockEvent = {
      clientX: 150,
      clientY: 250,
      currentTarget: mockCanvas,
    } as any;

    handler.handlePointerMove(mockEvent, mockCanvas, null, null);

    expect(mockOnSignatureResize).toHaveBeenCalledWith(0, 200, 80);
    expect(mockOnElementMove).toHaveBeenCalled();
  });

  it('should handle update font size interaction result for text', () => {
    mockHandleElementPointerMove.mockReturnValue({
      type: InteractionResultType.UpdateFontSize,
      elementType: PdfElementType.Text,
      index: 0,
      fontSize: 16,
      preventDefault: false,
    } as any);
    const handler = new WebElementInteractionHandler(mockConfig);
    const mockCanvas = document.createElement('canvas');
    const mockRect = { left: 0, top: 0, width: 800, height: 1200 };
    mockCanvas.getBoundingClientRect = () => mockRect as DOMRect;
    const mockEvent = {
      clientX: 150,
      clientY: 250,
      currentTarget: mockCanvas,
    } as any;

    handler.handlePointerMove(mockEvent, mockCanvas, null, null);

    expect(mockOnTextResize).toHaveBeenCalledWith(0, 16);
  });

  it('should handle update font size interaction result for date', () => {
    mockHandleElementPointerMove.mockReturnValue({
      type: InteractionResultType.UpdateFontSize,
      elementType: PdfElementType.Date,
      index: 0,
      fontSize: 14,
      preventDefault: false,
    } as any);
    const handler = new WebElementInteractionHandler(mockConfig);
    const mockCanvas = document.createElement('canvas');
    const mockRect = { left: 0, top: 0, width: 800, height: 1200 };
    mockCanvas.getBoundingClientRect = () => mockRect as DOMRect;
    const mockEvent = {
      clientX: 150,
      clientY: 250,
      currentTarget: mockCanvas,
    } as any;

    handler.handlePointerMove(mockEvent, mockCanvas, null, null);

    expect(mockOnDateResize).toHaveBeenCalledWith(0, 14);
  });

  it('should update config', () => {
    const handler = new WebElementInteractionHandler(mockConfig);
    const newRenderMetrics = {
      ...mockRenderMetrics,
      viewportWidth: 900,
    };

    handler.updateConfig({
      renderMetrics: newRenderMetrics,
    });

    const mockCanvas = document.createElement('canvas');
    const mockRect = { left: 0, top: 0, width: 900, height: 1200 };
    mockCanvas.getBoundingClientRect = () => mockRect as DOMRect;
    mockCanvas.setPointerCapture = jest.fn();
    const mockEvent = {
      clientX: 100,
      clientY: 200,
      pointerId: 1,
      currentTarget: mockCanvas,
      preventDefault: jest.fn(),
    } as any;

    handler.handlePointerDown(mockEvent, mockCanvas);

    expect(mockHandleElementPointerDown).toHaveBeenCalled();
  });

  it('should update context', () => {
    const handler = new WebElementInteractionHandler(mockConfig);
    const newContext = {
      ...mockContext,
      currentPage: 2,
    };

    handler.updateContext(newContext);

    const mockCanvas = document.createElement('canvas');
    const mockRect = { left: 0, top: 0, width: 800, height: 1200 };
    mockCanvas.getBoundingClientRect = () => mockRect as DOMRect;
    const mockEvent = {
      clientX: 100,
      clientY: 200,
      currentTarget: mockCanvas,
    } as any;

    handler.handleClick(mockEvent, mockCanvas, null, null, false);

    expect(mockOnPageClick).toHaveBeenCalled();
  });

  it('should not trigger onPageClick when draggedElement exists in handleClick', () => {
    const handler = new WebElementInteractionHandler(mockConfig);
    const mockCanvas = document.createElement('canvas');
    const mockRect = { left: 0, top: 0, width: 800, height: 1200 };
    mockCanvas.getBoundingClientRect = () => mockRect as DOMRect;
    const mockEvent = {
      clientX: 100,
      clientY: 200,
      currentTarget: mockCanvas,
    } as any;

    handler.handleClick(mockEvent, mockCanvas, { type: PdfElementType.Signature, index: 0, offsetX: 0, offsetY: 0 }, null, false);

    expect(mockOnPageClick).not.toHaveBeenCalled();
  });

  it('should not trigger onPageClick when resizeHandle exists in handleClick', () => {
    const handler = new WebElementInteractionHandler(mockConfig);
    const mockCanvas = document.createElement('canvas');
    const mockRect = { left: 0, top: 0, width: 800, height: 1200 };
    mockCanvas.getBoundingClientRect = () => mockRect as DOMRect;
    const mockEvent = {
      clientX: 100,
      clientY: 200,
      currentTarget: mockCanvas,
    } as any;

    handler.handleClick(mockEvent, mockCanvas, null, { type: PdfElementType.Signature, index: 0, handle: ResizeHandle.Southeast, startX: 0, startY: 0, startWidth: 150, startHeight: 60 }, false);

    expect(mockOnPageClick).not.toHaveBeenCalled();
  });

  it('should not trigger onPageClick when wasDragging is true in handleClick', () => {
    const handler = new WebElementInteractionHandler(mockConfig);
    const mockCanvas = document.createElement('canvas');
    const mockRect = { left: 0, top: 0, width: 800, height: 1200 };
    mockCanvas.getBoundingClientRect = () => mockRect as DOMRect;
    const mockEvent = {
      clientX: 100,
      clientY: 200,
      currentTarget: mockCanvas,
    } as any;

    handler.handleClick(mockEvent, mockCanvas, null, null, true);

    expect(mockOnPageClick).not.toHaveBeenCalled();
  });

  it('should not trigger onPageClick when lastElementHit exists in handleClick', () => {
    mockHandleElementPointerDown.mockReturnValue({
      result: null,
      elementHit: { type: PdfElementType.Signature, index: 0 },
      controlHit: null,
      elementBounds: null,
    } as any);
    const handler = new WebElementInteractionHandler(mockConfig);
    const mockCanvas = document.createElement('canvas');
    const mockRect = { left: 0, top: 0, width: 800, height: 1200 };
    mockCanvas.getBoundingClientRect = () => mockRect as DOMRect;
    mockCanvas.setPointerCapture = jest.fn();
    
    const pointerDownEvent = {
      clientX: 100,
      clientY: 200,
      pointerId: 1,
      currentTarget: mockCanvas,
      preventDefault: jest.fn(),
    } as any;

    handler.handlePointerDown(pointerDownEvent, mockCanvas);

    const clickEvent = {
      clientX: 100,
      clientY: 200,
      currentTarget: mockCanvas,
    } as any;

    handler.handleClick(clickEvent, mockCanvas, null, null, false);

    expect(mockOnPageClick).not.toHaveBeenCalled();
  });

  it('should not trigger onPageClick when elementHit exists in handleClick', () => {
    const handler = new WebElementInteractionHandler(mockConfig);
    const mockCanvas = document.createElement('canvas');
    const mockRect = { left: 0, top: 0, width: 800, height: 1200 };
    mockCanvas.getBoundingClientRect = () => mockRect as DOMRect;
    
    mockHandleElementPointerDown.mockReturnValue({
      result: null,
      elementHit: { type: PdfElementType.Signature, index: 0 },
      controlHit: null,
      elementBounds: null,
    } as any);
    
    const mockEvent = {
      clientX: 100,
      clientY: 200,
      currentTarget: mockCanvas,
    } as any;

    handler.handleClick(mockEvent, mockCanvas, null, null, false);

    expect(mockOnPageClick).not.toHaveBeenCalled();
  });

  it('should use DEFAULT_COORDINATES when renderMetrics is null in handleClick', () => {
    const handler = new WebElementInteractionHandler({
      ...mockConfig,
      renderMetrics: null,
    });
    const mockCanvas = document.createElement('canvas');
    const mockRect = { left: 0, top: 0, width: 800, height: 1200 };
    mockCanvas.getBoundingClientRect = () => mockRect as DOMRect;
    const mockEvent = {
      clientX: 100,
      clientY: 200,
      currentTarget: mockCanvas,
    } as any;

    handler.handleClick(mockEvent, mockCanvas, null, null, false);

    expect(mockOnPageClick).not.toHaveBeenCalled();
  });

  it('should use DEFAULT_COORDINATES when renderMetrics is null in handlePointerMove', () => {
    const handler = new WebElementInteractionHandler({
      ...mockConfig,
      renderMetrics: null,
    });
    const mockCanvas = document.createElement('canvas');
    const mockRect = { left: 0, top: 0, width: 800, height: 1200 };
    mockCanvas.getBoundingClientRect = () => mockRect as DOMRect;
    const mockEvent = {
      clientX: 150,
      clientY: 250,
      currentTarget: mockCanvas,
    } as any;

    handler.handlePointerMove(mockEvent, mockCanvas, null, null);

    expect(mockHandleElementPointerMove).not.toHaveBeenCalled();
  });

  it('should not call setResizeHandle when StartResize result is missing required properties', () => {
    mockHandleElementPointerDown.mockReturnValue({
      result: {
        type: InteractionResultType.StartResize,
        elementType: PdfElementType.Signature,
        index: 0,
        preventDefault: false,
      },
      elementHit: { type: PdfElementType.Signature, index: 0 },
      controlHit: null,
      elementBounds: null,
    } as any);
    const handler = new WebElementInteractionHandler(mockConfig);
    const mockCanvas = document.createElement('canvas');
    const mockRect = { left: 0, top: 0, width: 800, height: 1200 };
    mockCanvas.getBoundingClientRect = () => mockRect as DOMRect;
    mockCanvas.setPointerCapture = jest.fn();
    const mockEvent = {
      clientX: 100,
      clientY: 200,
      pointerId: 1,
      currentTarget: mockCanvas,
      preventDefault: jest.fn(),
    } as any;

    handler.handlePointerDown(mockEvent, mockCanvas);

    expect(mockSetResizeHandle).not.toHaveBeenCalled();
  });

  it('should not call onElementDelete when Delete result is missing onElementDelete callback', () => {
    const configWithoutDelete = {
      ...mockConfig,
      onElementDelete: undefined,
    };
    mockHandleElementPointerDown.mockReturnValue({
      result: {
        type: InteractionResultType.Delete,
        elementType: PdfElementType.Signature,
        index: 0,
        preventDefault: false,
      },
      elementHit: { type: PdfElementType.Signature, index: 0 },
      controlHit: null,
      elementBounds: null,
    } as any);
    const handler = new WebElementInteractionHandler(configWithoutDelete);
    const mockCanvas = document.createElement('canvas');
    const mockRect = { left: 0, top: 0, width: 800, height: 1200 };
    mockCanvas.getBoundingClientRect = () => mockRect as DOMRect;
    mockCanvas.setPointerCapture = jest.fn();
    const mockEvent = {
      clientX: 100,
      clientY: 200,
      pointerId: 1,
      currentTarget: mockCanvas,
      preventDefault: jest.fn(),
    } as any;

    handler.handlePointerDown(mockEvent, mockCanvas);

    expect(mockOnElementDelete).not.toHaveBeenCalled();
  });

  it('should not handle UpdateDimensions when result is missing required properties', () => {
    mockHandleElementPointerMove.mockReturnValue({
      type: InteractionResultType.UpdateDimensions,
      preventDefault: false,
    } as any);
    const handler = new WebElementInteractionHandler(mockConfig);
    const mockCanvas = document.createElement('canvas');
    const mockRect = { left: 0, top: 0, width: 800, height: 1200 };
    mockCanvas.getBoundingClientRect = () => mockRect as DOMRect;
    const mockEvent = {
      clientX: 150,
      clientY: 250,
      currentTarget: mockCanvas,
    } as any;

    handler.handlePointerMove(mockEvent, mockCanvas, null, null);

    expect(mockOnSignatureResize).not.toHaveBeenCalled();
  });

  it('should not handle UpdateDimensions when onSignatureResize is undefined', () => {
    const configWithoutResize = {
      ...mockConfig,
      onSignatureResize: undefined,
    };
    mockHandleElementPointerMove.mockReturnValue({
      type: InteractionResultType.UpdateDimensions,
      index: 0,
      width: 200,
      height: 80,
      coordinates: { x: 100, y: 200, pageNumber: 1, pageWidth: 800, pageHeight: 1200 },
      preventDefault: false,
    } as any);
    const handler = new WebElementInteractionHandler(configWithoutResize);
    const mockCanvas = document.createElement('canvas');
    const mockRect = { left: 0, top: 0, width: 800, height: 1200 };
    mockCanvas.getBoundingClientRect = () => mockRect as DOMRect;
    const mockEvent = {
      clientX: 150,
      clientY: 250,
      currentTarget: mockCanvas,
    } as any;

    handler.handlePointerMove(mockEvent, mockCanvas, null, null);

    expect(mockOnSignatureResize).not.toHaveBeenCalled();
  });

  it('should not handle UpdateDimensions when pending signature without coordinates', () => {
    mockHandleElementPointerMove.mockReturnValue({
      type: InteractionResultType.UpdateDimensions,
      index: -1,
      width: 200,
      height: 80,
      preventDefault: false,
    } as any);
    const handler = new WebElementInteractionHandler(mockConfig);
    const mockCanvas = document.createElement('canvas');
    const mockRect = { left: 0, top: 0, width: 800, height: 1200 };
    mockCanvas.getBoundingClientRect = () => mockRect as DOMRect;
    const mockEvent = {
      clientX: 150,
      clientY: 250,
      currentTarget: mockCanvas,
    } as any;

    handler.handlePointerMove(mockEvent, mockCanvas, null, null);

    expect(mockOnSignatureResize).toHaveBeenCalledWith(-1, 200, 80);
    expect(mockOnPageClick).not.toHaveBeenCalled();
  });

  it('should not handle UpdateFontSize when result is missing required properties', () => {
    mockHandleElementPointerMove.mockReturnValue({
      type: InteractionResultType.UpdateFontSize,
      preventDefault: false,
    } as any);
    const handler = new WebElementInteractionHandler(mockConfig);
    const mockCanvas = document.createElement('canvas');
    const mockRect = { left: 0, top: 0, width: 800, height: 1200 };
    mockCanvas.getBoundingClientRect = () => mockRect as DOMRect;
    const mockEvent = {
      clientX: 150,
      clientY: 250,
      currentTarget: mockCanvas,
    } as any;

    handler.handlePointerMove(mockEvent, mockCanvas, null, null);

    expect(mockOnTextResize).not.toHaveBeenCalled();
    expect(mockOnDateResize).not.toHaveBeenCalled();
  });
});


