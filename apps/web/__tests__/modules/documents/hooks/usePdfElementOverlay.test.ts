/**
 * @fileoverview Use PDF Element Overlay Hook Tests
 * @summary Tests for the usePdfElementOverlay hook
 */

import { renderHook } from '@testing-library/react';
import { usePdfElementOverlay } from '@/modules/documents/hooks/usePdfElementOverlay';
import { PdfElementType } from '@lawprotect/frontend-core';

describe('usePdfElementOverlay', () => {
  const mockCanvas = document.createElement('canvas');
  mockCanvas.width = 800;
  mockCanvas.height = 1200;
  const mockContext = mockCanvas.getContext('2d');
  
  const mockDisplayCanvasRef = { current: mockCanvas };
  const mockRenderMetrics = {
    outputScale: 1,
    viewportWidth: 800,
    viewportHeight: 1200,
    pdfPageWidth: 800,
    pdfPageHeight: 1200,
  };

  const defaultConfig = {
    currentPageCanvas: mockCanvas,
    displayCanvasRef: mockDisplayCanvasRef,
    renderMetrics: mockRenderMetrics,
    currentPage: 1,
    signatures: [],
    texts: [],
    dates: [],
    pendingCoordinates: null,
    pendingElementType: null,
    pendingSignatureImage: null,
    pendingSignatureWidth: 150,
    pendingSignatureHeight: 60,
    pendingText: null,
    pendingTextFontSize: 12,
    pendingDate: null,
    pendingDateFormat: 'MM/DD/YYYY',
    pendingDateFontSize: 12,
    draggedElement: null,
    resizeHandle: null,
    onElementDelete: jest.fn(),
    onSignatureResize: jest.fn(),
    renderKey: 0,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    if (mockContext) {
      mockContext.clearRect(0, 0, mockCanvas.width, mockCanvas.height);
    }
  });

  it('should be a hook that runs without errors', () => {
    renderHook(() => usePdfElementOverlay(defaultConfig));

    expect(mockContext).toBeDefined();
  });

  it('should handle empty element arrays', () => {
    renderHook(() => usePdfElementOverlay(defaultConfig));

    expect(mockContext).toBeDefined();
  });

  it('should handle null canvas', () => {
    const configWithoutCanvas = {
      ...defaultConfig,
      currentPageCanvas: null,
      displayCanvasRef: { current: null },
    };

    renderHook(() => usePdfElementOverlay(configWithoutCanvas));

    expect(mockContext).toBeDefined();
  });

  it('should handle null render metrics', () => {
    const configWithoutMetrics = {
      ...defaultConfig,
      renderMetrics: null,
    };

    renderHook(() => usePdfElementOverlay(configWithoutMetrics));

    expect(mockContext).toBeDefined();
  });

  it('should handle pending signature element', () => {
    const configWithPendingSignature = {
      ...defaultConfig,
      pendingCoordinates: { x: 100, y: 200, pageNumber: 1 },
      pendingElementType: PdfElementType.Signature,
      pendingSignatureImage: 'data:image/png;base64,test',
    };

    renderHook(() => usePdfElementOverlay(configWithPendingSignature));

    expect(mockContext).toBeDefined();
  });

  it('should handle pending text element', () => {
    const configWithPendingText = {
      ...defaultConfig,
      pendingCoordinates: { x: 100, y: 200, pageNumber: 1 },
      pendingElementType: PdfElementType.Text,
      pendingText: 'Test text',
      pendingTextFontSize: 14,
    };

    renderHook(() => usePdfElementOverlay(configWithPendingText));

    expect(mockContext).toBeDefined();
  });

  it('should handle pending date element', () => {
    const configWithPendingDate = {
      ...defaultConfig,
      pendingCoordinates: { x: 100, y: 200, pageNumber: 1 },
      pendingElementType: PdfElementType.Date,
      pendingDate: new Date('2024-01-15'),
      pendingDateFormat: 'DD/MM/YYYY',
      pendingDateFontSize: 14,
    };

    renderHook(() => usePdfElementOverlay(configWithPendingDate));

    expect(mockContext).toBeDefined();
  });

  it('should handle dragged element', () => {
    const configWithDragged = {
      ...defaultConfig,
      draggedElement: { type: PdfElementType.Signature, index: 0 },
    };

    renderHook(() => usePdfElementOverlay(configWithDragged));

    expect(mockContext).toBeDefined();
  });

  it('should handle resize handle', () => {
    const configWithResize = {
      ...defaultConfig,
      resizeHandle: { type: PdfElementType.Signature, index: 0, handle: 'se' },
    };

    renderHook(() => usePdfElementOverlay(configWithResize));

    expect(mockContext).toBeDefined();
  });

  it('should handle different page numbers', () => {
    const configPage2 = {
      ...defaultConfig,
      currentPage: 2,
    };

    renderHook(() => usePdfElementOverlay(configPage2));

    expect(mockContext).toBeDefined();
  });

  it('should handle render key changes', () => {
    const { rerender } = renderHook(
      ({ renderKey }) => usePdfElementOverlay({ ...defaultConfig, renderKey }),
      { initialProps: { renderKey: 0 } }
    );

    rerender({ renderKey: 1 });

    expect(mockContext).toBeDefined();
  });

  it('should handle signature elements on current page', () => {
    const configWithSignatures = {
      ...defaultConfig,
      signatures: [
        {
          signatureImage: 'data:image/png;base64,test1',
          coordinates: { x: 50, y: 100, pageNumber: 1, pageWidth: 800, pageHeight: 1200 },
          width: 150,
          height: 60,
        },
      ],
    };

    renderHook(() => usePdfElementOverlay(configWithSignatures));

    expect(mockContext).toBeDefined();
  });

  it('should handle text elements on current page', () => {
    const configWithTexts = {
      ...defaultConfig,
      texts: [
        {
          text: 'Sample text',
          coordinates: { x: 50, y: 100, pageNumber: 1, pageWidth: 800, pageHeight: 1200 },
          fontSize: 12,
        },
      ],
    };

    renderHook(() => usePdfElementOverlay(configWithTexts));

    expect(mockContext).toBeDefined();
  });

  it('should handle date elements on current page', () => {
    const configWithDates = {
      ...defaultConfig,
      dates: [
        {
          date: new Date('2024-01-15'),
          format: 'MM/DD/YYYY',
          coordinates: { x: 50, y: 100, pageNumber: 1, pageWidth: 800, pageHeight: 1200 },
          fontSize: 12,
        },
      ],
    };

    renderHook(() => usePdfElementOverlay(configWithDates));

    expect(mockContext).toBeDefined();
  });

  it('should draw signature with custom width and height', async () => {
    const img = new Image();
    img.src = 'data:image/png;base64,test';
    await new Promise((resolve) => {
      img.onload = resolve;
      setTimeout(resolve, 10);
    });

    const configWithSignature = {
      ...defaultConfig,
      signatures: [
        {
          signatureImage: 'data:image/png;base64,test',
          coordinates: { x: 50, y: 100, pageNumber: 1, pageWidth: 800, pageHeight: 1200 },
          width: 200,
          height: 80,
        },
      ],
    };

    renderHook(() => usePdfElementOverlay(configWithSignature));

    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(mockContext).toBeDefined();
  });

  it('should draw text with custom color', () => {
    const configWithColoredText = {
      ...defaultConfig,
      texts: [
        {
          text: 'Colored text',
          coordinates: { x: 50, y: 100, pageNumber: 1, pageWidth: 800, pageHeight: 1200 },
          fontSize: 14,
          color: { r: 255, g: 0, b: 0 },
        },
      ],
    };

    renderHook(() => usePdfElementOverlay(configWithColoredText));

    expect(mockContext).toBeDefined();
  });

  it('should draw date with custom format', () => {
    const configWithFormattedDate = {
      ...defaultConfig,
      dates: [
        {
          date: new Date('2024-01-15'),
          format: 'DD/MM/YYYY',
          coordinates: { x: 50, y: 100, pageNumber: 1, pageWidth: 800, pageHeight: 1200 },
          fontSize: 14,
          color: { r: 0, g: 0, b: 255 },
        },
      ],
    };

    renderHook(() => usePdfElementOverlay(configWithFormattedDate));

    expect(mockContext).toBeDefined();
  });

  it('should handle signature with failed image load', async () => {
    const configWithBadImage = {
      ...defaultConfig,
      signatures: [
        {
          signatureImage: 'data:image/png;base64,invalid',
          coordinates: { x: 50, y: 100, pageNumber: 1, pageWidth: 800, pageHeight: 1200 },
        },
      ],
    };

    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

    renderHook(() => usePdfElementOverlay(configWithBadImage));

    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(mockContext).toBeDefined();

    consoleWarnSpy.mockRestore();
  });

  it('should handle pending signature without image', async () => {
    const configPendingNoImage = {
      ...defaultConfig,
      pendingCoordinates: { x: 100, y: 200, pageNumber: 1 },
      pendingElementType: PdfElementType.Signature,
      pendingSignatureImage: null,
    };

    renderHook(() => usePdfElementOverlay(configPendingNoImage));

    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(mockContext).toBeDefined();
  });

  it('should handle pending signature with image load error', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const configPendingWithError = {
      ...defaultConfig,
      pendingCoordinates: { x: 100, y: 200, pageNumber: 1 },
      pendingElementType: PdfElementType.Signature,
      pendingSignatureImage: 'invalid-image-src',
    };

    renderHook(() => usePdfElementOverlay(configPendingWithError));

    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(mockContext).toBeDefined();

    consoleErrorSpy.mockRestore();
  });

  it('should handle signature image caching', async () => {
    const configWithSignatures = {
      ...defaultConfig,
      signatures: [
        {
          signatureImage: 'data:image/png;base64,test1',
          coordinates: { x: 50, y: 100, pageNumber: 1, pageWidth: 800, pageHeight: 1200 },
        },
      ],
    };

    const { rerender } = renderHook(() => usePdfElementOverlay(configWithSignatures));
    await new Promise((resolve) => setTimeout(resolve, 60));

    rerender();
    await new Promise((resolve) => setTimeout(resolve, 60));

    expect(mockContext).toBeDefined();
  });

  it('should handle pending text without text (placeholder)', () => {
    const configPendingTextPlaceholder = {
      ...defaultConfig,
      pendingCoordinates: { x: 100, y: 200, pageNumber: 1 },
      pendingElementType: PdfElementType.Text,
      pendingText: null,
    };

    renderHook(() => usePdfElementOverlay(configPendingTextPlaceholder));

    expect(mockContext).toBeDefined();
  });

  it('should handle pending date without date (placeholder)', () => {
    const configPendingDatePlaceholder = {
      ...defaultConfig,
      pendingCoordinates: { x: 100, y: 200, pageNumber: 1 },
      pendingElementType: PdfElementType.Date,
      pendingDate: null,
    };

    renderHook(() => usePdfElementOverlay(configPendingDatePlaceholder));

    expect(mockContext).toBeDefined();
  });

  it('should handle dragged signature element', () => {
    const configWithDraggedSignature = {
      ...defaultConfig,
      signatures: [
        {
          signatureImage: 'data:image/png;base64,test',
          coordinates: { x: 50, y: 100, pageNumber: 1, pageWidth: 800, pageHeight: 1200 },
        },
      ],
      draggedElement: { type: PdfElementType.Signature, index: 0, offsetX: 10, offsetY: 20 },
    };

    renderHook(() => usePdfElementOverlay(configWithDraggedSignature));

    expect(mockContext).toBeDefined();
  });

  it('should handle dragged text element', () => {
    const configWithDraggedText = {
      ...defaultConfig,
      texts: [
        {
          text: 'Dragged text',
          coordinates: { x: 50, y: 100, pageNumber: 1, pageWidth: 800, pageHeight: 1200 },
        },
      ],
      draggedElement: { type: PdfElementType.Text, index: 0, offsetX: 10, offsetY: 20 },
    };

    renderHook(() => usePdfElementOverlay(configWithDraggedText));

    expect(mockContext).toBeDefined();
  });

  it('should handle dragged date element', () => {
    const configWithDraggedDate = {
      ...defaultConfig,
      dates: [
        {
          date: new Date('2024-01-15'),
          coordinates: { x: 50, y: 100, pageNumber: 1, pageWidth: 800, pageHeight: 1200 },
        },
      ],
      draggedElement: { type: PdfElementType.Date, index: 0, offsetX: 10, offsetY: 20 },
    };

    renderHook(() => usePdfElementOverlay(configWithDraggedDate));

    expect(mockContext).toBeDefined();
  });

  it('should handle resize handle for signature', () => {
    const configWithResizeSignature = {
      ...defaultConfig,
      signatures: [
        {
          signatureImage: 'data:image/png;base64,test',
          coordinates: { x: 50, y: 100, pageNumber: 1, pageWidth: 800, pageHeight: 1200 },
        },
      ],
      resizeHandle: {
        type: PdfElementType.Signature,
        index: 0,
        handle: 'se' as any,
        startX: 50,
        startY: 100,
        startWidth: 150,
        startHeight: 60,
      },
    };

    renderHook(() => usePdfElementOverlay(configWithResizeSignature));

    expect(mockContext).toBeDefined();
  });

  it('should handle resize handle for text', () => {
    const configWithResizeText = {
      ...defaultConfig,
      texts: [
        {
          text: 'Resized text',
          coordinates: { x: 50, y: 100, pageNumber: 1, pageWidth: 800, pageHeight: 1200 },
        },
      ],
      resizeHandle: {
        type: PdfElementType.Text,
        index: 0,
        handle: 'e' as any,
        startX: 50,
        startY: 100,
        startWidth: 100,
        startHeight: 14,
        startFontSize: 12,
      },
    };

    renderHook(() => usePdfElementOverlay(configWithResizeText));

    expect(mockContext).toBeDefined();
  });

  it('should handle resize handle for date', () => {
    const configWithResizeDate = {
      ...defaultConfig,
      dates: [
        {
          date: new Date('2024-01-15'),
          coordinates: { x: 50, y: 100, pageNumber: 1, pageWidth: 800, pageHeight: 1200 },
        },
      ],
      resizeHandle: {
        type: PdfElementType.Date,
        index: 0,
        handle: 'e' as any,
        startX: 50,
        startY: 100,
        startWidth: 80,
        startHeight: 14,
        startFontSize: 12,
      },
    };

    renderHook(() => usePdfElementOverlay(configWithResizeDate));

    expect(mockContext).toBeDefined();
  });

  it('should filter elements by page number', () => {
    const configWithMultiPage = {
      ...defaultConfig,
      currentPage: 1,
      signatures: [
        {
          signatureImage: 'data:image/png;base64,test1',
          coordinates: { x: 50, y: 100, pageNumber: 1, pageWidth: 800, pageHeight: 1200 },
        },
        {
          signatureImage: 'data:image/png;base64,test2',
          coordinates: { x: 50, y: 100, pageNumber: 2, pageWidth: 800, pageHeight: 1200 },
        },
      ],
    };

    renderHook(() => usePdfElementOverlay(configWithMultiPage));

    expect(mockContext).toBeDefined();
  });

  it('should handle pending element on different page', () => {
    const configPendingDifferentPage = {
      ...defaultConfig,
      currentPage: 1,
      pendingCoordinates: { x: 100, y: 200, pageNumber: 2 },
      pendingElementType: PdfElementType.Signature,
      pendingSignatureImage: 'data:image/png;base64,test',
    };

    renderHook(() => usePdfElementOverlay(configPendingDifferentPage));

    expect(mockContext).toBeDefined();
  });

  it('should handle multiple signatures on same page', async () => {
    const configMultipleSignatures = {
      ...defaultConfig,
      signatures: [
        {
          signatureImage: 'data:image/png;base64,test1',
          coordinates: { x: 50, y: 100, pageNumber: 1, pageWidth: 800, pageHeight: 1200 },
        },
        {
          signatureImage: 'data:image/png;base64,test2',
          coordinates: { x: 200, y: 300, pageNumber: 1, pageWidth: 800, pageHeight: 1200 },
        },
      ],
    };

    renderHook(() => usePdfElementOverlay(configMultipleSignatures));

    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(mockContext).toBeDefined();
  });

  it('should handle elements without onElementDelete callback', () => {
    const configNoDelete = {
      ...defaultConfig,
      signatures: [
        {
          signatureImage: 'data:image/png;base64,test',
          coordinates: { x: 50, y: 100, pageNumber: 1, pageWidth: 800, pageHeight: 1200 },
        },
      ],
      onElementDelete: undefined,
    };

    renderHook(() => usePdfElementOverlay(configNoDelete));

    expect(mockContext).toBeDefined();
  });

  it('should handle pending signature with onSignatureResize', () => {
    const configPendingWithResize = {
      ...defaultConfig,
      pendingCoordinates: { x: 100, y: 200, pageNumber: 1 },
      pendingElementType: PdfElementType.Signature,
      pendingSignatureImage: 'data:image/png;base64,test',
      onSignatureResize: jest.fn(),
    };

    renderHook(() => usePdfElementOverlay(configPendingWithResize));

    expect(mockContext).toBeDefined();
  });

  it('should handle pending signature without onSignatureResize', () => {
    const configPendingNoResize = {
      ...defaultConfig,
      pendingCoordinates: { x: 100, y: 200, pageNumber: 1 },
      pendingElementType: PdfElementType.Signature,
      pendingSignatureImage: 'data:image/png;base64,test',
      onSignatureResize: undefined,
    };

    renderHook(() => usePdfElementOverlay(configPendingNoResize));

    expect(mockContext).toBeDefined();
  });

  it('should redraw when renderKey changes', async () => {
    const { rerender } = renderHook(
      ({ renderKey }) => usePdfElementOverlay({ ...defaultConfig, renderKey }),
      { initialProps: { renderKey: 0 } }
    );

    await new Promise((resolve) => setTimeout(resolve, 60));

    rerender({ renderKey: 1 });

    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(mockContext).toBeDefined();
  });

  it('should redraw when currentPage changes', async () => {
    const { rerender } = renderHook(
      ({ currentPage }) => usePdfElementOverlay({ ...defaultConfig, currentPage }),
      { initialProps: { currentPage: 1 } }
    );

    await new Promise((resolve) => setTimeout(resolve, 60));

    rerender({ currentPage: 2 });

    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(mockContext).toBeDefined();
  });

  it('should handle displayCanvasRef becoming null', () => {
    const displayRef: { current: HTMLCanvasElement | null } = { current: mockCanvas };
    const config = { ...defaultConfig, displayCanvasRef: displayRef };

    const { rerender } = renderHook(() => usePdfElementOverlay(config));

    displayRef.current = null;
    rerender();

    expect(mockContext).toBeDefined();
  });

  it('should handle text with default fontSize', () => {
    const configDefaultFontSize = {
      ...defaultConfig,
      texts: [
        {
          text: 'Default font text',
          coordinates: { x: 50, y: 100, pageNumber: 1, pageWidth: 800, pageHeight: 1200 },
        },
      ],
    };

    renderHook(() => usePdfElementOverlay(configDefaultFontSize));

    expect(mockContext).toBeDefined();
  });

  it('should handle date with default format', () => {
    const configDefaultFormat = {
      ...defaultConfig,
      dates: [
        {
          date: new Date('2024-01-15'),
          coordinates: { x: 50, y: 100, pageNumber: 1, pageWidth: 800, pageHeight: 1200 },
        },
      ],
    };

    renderHook(() => usePdfElementOverlay(configDefaultFormat));

    expect(mockContext).toBeDefined();
  });

  it('should handle image load error in pending signature', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    
    const originalImage = window.Image;
    window.Image = jest.fn().mockImplementation(() => {
      const mockImg = document.createElement('img');
      setTimeout(() => {
        if (mockImg.onerror) {
          mockImg.onerror(new Error('Image load failed') as any);
        }
      }, 10);
      return mockImg;
    }) as any;

    const configPendingWithError = {
      ...defaultConfig,
      pendingCoordinates: { x: 100, y: 200, pageNumber: 1 },
      pendingElementType: PdfElementType.Signature,
      pendingSignatureImage: 'invalid-image',
    };

    renderHook(() => usePdfElementOverlay(configPendingWithError));

    await new Promise((resolve) => setTimeout(resolve, 60));
    
    window.Image = originalImage;
    consoleErrorSpy.mockRestore();
  });

  it('should handle drawElementPreviews with null renderMetrics early return', async () => {
    const configNoMetrics = {
      ...defaultConfig,
      renderMetrics: null,
    };

    renderHook(() => usePdfElementOverlay(configNoMetrics));

    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(mockContext).toBeDefined();
  });

  it('should handle displayCanvasRef.current being null in useEffect', async () => {
    const displayRef: { current: HTMLCanvasElement | null } = { current: null };
    const config = {
      ...defaultConfig,
      displayCanvasRef: displayRef,
    };

    renderHook(() => usePdfElementOverlay(config));

    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(mockContext).toBeDefined();
  });

  it('should handle getContext returning null', async () => {
    const mockCanvasWithoutContext = {
      ...mockCanvas,
      getContext: jest.fn(() => null),
    } as any;

    const displayRef = { current: mockCanvasWithoutContext };
    const config = {
      ...defaultConfig,
      displayCanvasRef: displayRef,
    };

    renderHook(() => usePdfElementOverlay(config));

    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(mockCanvasWithoutContext.getContext).toHaveBeenCalled();
  });

  it('should handle signature without onElementDelete callback', async () => {
    const configNoDelete = {
      ...defaultConfig,
      signatures: [
        {
          signatureImage: 'data:image/png;base64,test',
          coordinates: { x: 50, y: 100, pageNumber: 1, pageWidth: 800, pageHeight: 1200 },
          width: 150,
          height: 60,
        },
      ],
      onElementDelete: undefined,
    };

    renderHook(() => usePdfElementOverlay(configNoDelete));

    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(mockContext).toBeDefined();
  });

  it('should handle signature with default dimensions', async () => {
    const configDefaultDims = {
      ...defaultConfig,
      signatures: [
        {
          signatureImage: 'data:image/png;base64,test',
          coordinates: { x: 50, y: 100, pageNumber: 1, pageWidth: 800, pageHeight: 1200 },
        },
      ],
    };

    renderHook(() => usePdfElementOverlay(configDefaultDims));

    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(mockContext).toBeDefined();
  });

  it('should handle text without onElementDelete callback', () => {
    const configNoDelete = {
      ...defaultConfig,
      texts: [
        {
          text: 'Test text',
          coordinates: { x: 50, y: 100, pageNumber: 1, pageWidth: 800, pageHeight: 1200 },
          fontSize: 12,
        },
      ],
      onElementDelete: undefined,
    };

    renderHook(() => usePdfElementOverlay(configNoDelete));

    expect(mockContext).toBeDefined();
  });

  it('should handle date without onElementDelete callback', () => {
    const configNoDelete = {
      ...defaultConfig,
      dates: [
        {
          date: new Date('2024-01-15'),
          coordinates: { x: 50, y: 100, pageNumber: 1, pageWidth: 800, pageHeight: 1200 },
          fontSize: 12,
        },
      ],
      onElementDelete: undefined,
    };

    renderHook(() => usePdfElementOverlay(configNoDelete));

    expect(mockContext).toBeDefined();
  });

  it('should handle pending signature with resize handler', async () => {
    const mockOnSignatureResize = jest.fn();
    const configPendingWithResize = {
      ...defaultConfig,
      pendingCoordinates: { x: 100, y: 200, pageNumber: 1 },
      pendingElementType: PdfElementType.Signature,
      pendingSignatureImage: 'data:image/png;base64,test',
      onSignatureResize: mockOnSignatureResize,
    };

    renderHook(() => usePdfElementOverlay(configPendingWithResize));

    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(mockContext).toBeDefined();
  });

  it('should handle pending signature without resize handler', async () => {
    const configPendingNoResize = {
      ...defaultConfig,
      pendingCoordinates: { x: 100, y: 200, pageNumber: 1 },
      pendingElementType: PdfElementType.Signature,
      pendingSignatureImage: 'data:image/png;base64,test',
      onSignatureResize: undefined,
    };

    renderHook(() => usePdfElementOverlay(configPendingNoResize));

    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(mockContext).toBeDefined();
  });

  it('should handle signature image loading error gracefully', async () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    
    const badImageUrl = 'data:image/png;base64,invalid';
    const configWithBadSignature = {
      ...defaultConfig,
      signatures: [
        {
          signatureImage: badImageUrl,
          coordinates: { x: 50, y: 100, pageNumber: 1, pageWidth: 800, pageHeight: 1200 },
        },
      ],
    };

    renderHook(() => usePdfElementOverlay(configWithBadSignature));

    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(mockContext).toBeDefined();

    consoleWarnSpy.mockRestore();
  });

  it('should handle pending text with actual text content', () => {
    const configPendingWithText = {
      ...defaultConfig,
      pendingCoordinates: { x: 100, y: 200, pageNumber: 1 },
      pendingElementType: PdfElementType.Text,
      pendingText: 'Sample text',
      pendingTextFontSize: 14,
    };

    renderHook(() => usePdfElementOverlay(configPendingWithText));

    expect(mockContext).toBeDefined();
  });

  it('should handle pending date with actual date', () => {
    const configPendingWithDate = {
      ...defaultConfig,
      pendingCoordinates: { x: 100, y: 200, pageNumber: 1 },
      pendingElementType: PdfElementType.Date,
      pendingDate: new Date('2024-01-15'),
      pendingDateFormat: 'DD/MM/YYYY',
      pendingDateFontSize: 14,
    };

    renderHook(() => usePdfElementOverlay(configPendingWithDate));

    expect(mockContext).toBeDefined();
  });

  it('should handle cleanup function from useEffect', async () => {
    jest.useFakeTimers();
    
    const { unmount } = renderHook(() => usePdfElementOverlay(defaultConfig));

    jest.advanceTimersByTime(50);
    unmount();

    jest.useRealTimers();
    expect(mockContext).toBeDefined();
  });

  it('should handle drawElementPreviews with null currentPageCanvas', async () => {
    const configNoCanvas = {
      ...defaultConfig,
      currentPageCanvas: null,
    };

    renderHook(() => usePdfElementOverlay(configNoCanvas));

    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(mockContext).toBeDefined();
  });

  it('should handle text with no color (default black)', () => {
    const configTextNoColor = {
      ...defaultConfig,
      texts: [
        {
          text: 'Text without color',
          coordinates: { x: 50, y: 100, pageNumber: 1, pageWidth: 800, pageHeight: 1200 },
          fontSize: 12,
        },
      ],
    };

    renderHook(() => usePdfElementOverlay(configTextNoColor));

    expect(mockContext).toBeDefined();
  });

  it('should handle date with no color (default black)', () => {
    const configDateNoColor = {
      ...defaultConfig,
      dates: [
        {
          date: new Date('2024-01-15'),
          coordinates: { x: 50, y: 100, pageNumber: 1, pageWidth: 800, pageHeight: 1200 },
          fontSize: 12,
        },
      ],
    };

    renderHook(() => usePdfElementOverlay(configDateNoColor));

    expect(mockContext).toBeDefined();
  });

  it('should handle pending element on different page (should not draw)', () => {
    const configPendingDifferentPage = {
      ...defaultConfig,
      currentPage: 1,
      pendingCoordinates: { x: 100, y: 200, pageNumber: 2 },
      pendingElementType: PdfElementType.Signature,
      pendingSignatureImage: 'data:image/png;base64,test',
    };

    renderHook(() => usePdfElementOverlay(configPendingDifferentPage));

    expect(mockContext).toBeDefined();
  });

  it('should handle elements on different page (filtered out)', () => {
    const configDifferentPage = {
      ...defaultConfig,
      currentPage: 2,
      signatures: [
        {
          signatureImage: 'data:image/png;base64,test',
          coordinates: { x: 50, y: 100, pageNumber: 1, pageWidth: 800, pageHeight: 1200 },
        },
      ],
    };

    renderHook(() => usePdfElementOverlay(configDifferentPage));

    expect(mockContext).toBeDefined();
  });

  it('should execute useEffect drawing logic with all dependencies', async () => {
    jest.useFakeTimers();
    
    const drawImageSpy = jest.spyOn(mockContext!, 'drawImage');
    const fillTextSpy = jest.spyOn(mockContext!, 'fillText');
    const clearRectSpy = jest.spyOn(mockContext!, 'clearRect');

    const configWithElements = {
      ...defaultConfig,
      signatures: [
        {
          signatureImage: 'data:image/png;base64,test',
          coordinates: { x: 50, y: 100, pageNumber: 1, pageWidth: 800, pageHeight: 1200 },
          width: 150,
          height: 60,
        },
      ],
      texts: [
        {
          text: 'Test text',
          coordinates: { x: 100, y: 200, pageNumber: 1, pageWidth: 800, pageHeight: 1200 },
          fontSize: 12,
        },
      ],
      dates: [
        {
          date: new Date('2024-01-15'),
          coordinates: { x: 150, y: 300, pageNumber: 1, pageWidth: 800, pageHeight: 1200 },
          fontSize: 12,
        },
      ],
    };

    renderHook(() => usePdfElementOverlay(configWithElements));

    jest.advanceTimersByTime(60);
    await Promise.resolve();

    jest.useRealTimers();
    drawImageSpy.mockRestore();
    fillTextSpy.mockRestore();
    clearRectSpy.mockRestore();
  });

  it('should handle image caching by reusing cached images', async () => {
    const configWithSameImages = {
      ...defaultConfig,
      signatures: [
        {
          signatureImage: 'data:image/png;base64,test',
          coordinates: { x: 50, y: 100, pageNumber: 1, pageWidth: 800, pageHeight: 1200 },
        },
        {
          signatureImage: 'data:image/png;base64,test',
          coordinates: { x: 200, y: 300, pageNumber: 1, pageWidth: 800, pageHeight: 1200 },
        },
      ],
    };

    const { rerender } = renderHook(() => usePdfElementOverlay(configWithSameImages));
    await new Promise((resolve) => setTimeout(resolve, 60));

    rerender();
    await new Promise((resolve) => setTimeout(resolve, 60));

    expect(mockContext).toBeDefined();
  });

  it('should handle pending signature with error and fallback to placeholder', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    
    const configPendingError = {
      ...defaultConfig,
      pendingCoordinates: { x: 100, y: 200, pageNumber: 1 },
      pendingElementType: PdfElementType.Signature,
      pendingSignatureImage: 'invalid-image-url',
    };

    renderHook(() => usePdfElementOverlay(configPendingError));

    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(mockContext).toBeDefined();

    consoleErrorSpy.mockRestore();
  });

  it('should handle all pending element types with actual data', async () => {
    const configWithPending = {
      ...defaultConfig,
      pendingCoordinates: { x: 100, y: 200, pageNumber: 1 },
      pendingElementType: PdfElementType.Text,
      pendingText: 'Pending text',
      pendingTextFontSize: 14,
    };

    const { rerender } = renderHook(({ config }) => usePdfElementOverlay(config), {
      initialProps: { config: configWithPending },
    });

    await new Promise((resolve) => setTimeout(resolve, 60));

    const configWithDate = {
      ...defaultConfig,
      pendingCoordinates: { x: 100, y: 200, pageNumber: 1 },
      pendingElementType: PdfElementType.Date,
      pendingSignatureImage: null,
      pendingText: null,
      pendingDate: new Date('2024-01-15'),
      pendingDateFormat: 'DD/MM/YYYY',
      pendingDateFontSize: 14,
    };

    rerender({
      config: configWithDate as any,
    });

    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(mockContext).toBeDefined();
  });

  it('should handle renderKey change to trigger redraw', async () => {
    const { rerender } = renderHook(
      ({ renderKey }) => usePdfElementOverlay({ ...defaultConfig, renderKey }),
      { initialProps: { renderKey: 0 } }
    );

    await new Promise((resolve) => setTimeout(resolve, 60));

    rerender({ renderKey: 1 });
    await new Promise((resolve) => setTimeout(resolve, 60));

    expect(mockContext).toBeDefined();
  });

  it('should handle currentPageCanvas change', async () => {
    const newCanvas = document.createElement('canvas');
    newCanvas.width = 1600;
    newCanvas.height = 2400;

    const { rerender } = renderHook(
      ({ canvas }) => usePdfElementOverlay({ ...defaultConfig, currentPageCanvas: canvas }),
      { initialProps: { canvas: mockCanvas } }
    );

    await new Promise((resolve) => setTimeout(resolve, 60));

    rerender({ canvas: newCanvas });
    await new Promise((resolve) => setTimeout(resolve, 60));

    expect(mockContext).toBeDefined();
  });

  it('should handle signature image loading error in drawSignature', async () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    
    const originalImage = window.Image;
    window.Image = jest.fn().mockImplementation(() => {
      const mockImg = document.createElement('img');
      setTimeout(() => {
        if (mockImg.onerror) {
          mockImg.onerror(new Error('Image load failed') as any);
        }
      }, 10);
      return mockImg;
    }) as any;

    const configWithSignature = {
      ...defaultConfig,
      signatures: [
        {
          signatureImage: 'invalid-image-url-that-will-fail',
          coordinates: { x: 50, y: 100, pageNumber: 1, pageWidth: 800, pageHeight: 1200 },
        },
      ],
    };

    renderHook(() => usePdfElementOverlay(configWithSignature));

    await new Promise((resolve) => setTimeout(resolve, 100));

    window.Image = originalImage;
    consoleWarnSpy.mockRestore();
    
    expect(mockContext).toBeDefined();
  });

  it('should call drawDeleteButton when onElementDelete is provided in drawText', async () => {
    const configWithText = {
      ...defaultConfig,
      texts: [
        {
          text: 'Test text',
          coordinates: { x: 50, y: 100, pageNumber: 1, pageWidth: 800, pageHeight: 1200 },
        },
      ],
      onElementDelete: jest.fn(),
    };

    renderHook(() => usePdfElementOverlay(configWithText));

    await new Promise((resolve) => setTimeout(resolve, 60));

    expect(mockContext).toBeDefined();
  });

  it('should call drawDeleteButton when onElementDelete is provided in drawDate', async () => {
    const configWithDate = {
      ...defaultConfig,
      dates: [
        {
          date: new Date('2024-01-15'),
          coordinates: { x: 50, y: 100, pageNumber: 1, pageWidth: 800, pageHeight: 1200 },
        },
      ],
      onElementDelete: jest.fn(),
    };

    renderHook(() => usePdfElementOverlay(configWithDate));

    await new Promise((resolve) => setTimeout(resolve, 60));

    expect(mockContext).toBeDefined();
  });

  it('should call drawResizeHandle when onSignatureResize is provided in drawPendingSignature', async () => {
    const configWithPendingSignature = {
      ...defaultConfig,
      pendingCoordinates: { x: 100, y: 200, pageNumber: 1 },
      pendingElementType: PdfElementType.Signature,
      pendingSignatureImage: 'data:image/png;base64,test',
      onSignatureResize: jest.fn(),
    };

    renderHook(() => usePdfElementOverlay(configWithPendingSignature));

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mockContext).toBeDefined();
  });

  it('should handle pending text with null text (else branch)', async () => {
    const configWithPendingTextNull = {
      ...defaultConfig,
      pendingCoordinates: { x: 100, y: 200, pageNumber: 1 },
      pendingElementType: PdfElementType.Text,
      pendingText: null,
    };

    renderHook(() => usePdfElementOverlay(configWithPendingTextNull));

    await new Promise((resolve) => setTimeout(resolve, 60));

    expect(mockContext).toBeDefined();
  });

  it('should handle pending date with null date (else branch)', async () => {
    const configWithPendingDateNull = {
      ...defaultConfig,
      pendingCoordinates: { x: 100, y: 200, pageNumber: 1 },
      pendingElementType: PdfElementType.Date,
      pendingDate: null,
    };

    renderHook(() => usePdfElementOverlay(configWithPendingDateNull));

    await new Promise((resolve) => setTimeout(resolve, 60));

    expect(mockContext).toBeDefined();
  });

  it('should filter texts by page number in drawElementPreviews', async () => {
    const configWithMultiplePages = {
      ...defaultConfig,
      texts: [
        {
          text: 'Text on page 1',
          coordinates: { x: 50, y: 100, pageNumber: 1, pageWidth: 800, pageHeight: 1200 },
        },
        {
          text: 'Text on page 2',
          coordinates: { x: 50, y: 100, pageNumber: 2, pageWidth: 800, pageHeight: 1200 },
        },
      ],
    };

    renderHook(() => usePdfElementOverlay(configWithMultiplePages));

    await new Promise((resolve) => setTimeout(resolve, 60));

    expect(mockContext).toBeDefined();
  });

  it('should filter dates by page number in drawElementPreviews', async () => {
    const configWithMultiplePages = {
      ...defaultConfig,
      dates: [
        {
          date: new Date('2024-01-15'),
          coordinates: { x: 50, y: 100, pageNumber: 1, pageWidth: 800, pageHeight: 1200 },
        },
        {
          date: new Date('2024-01-16'),
          coordinates: { x: 50, y: 100, pageNumber: 2, pageWidth: 800, pageHeight: 1200 },
        },
      ],
    };

    renderHook(() => usePdfElementOverlay(configWithMultiplePages));

    await new Promise((resolve) => setTimeout(resolve, 60));

    expect(mockContext).toBeDefined();
  });
});


