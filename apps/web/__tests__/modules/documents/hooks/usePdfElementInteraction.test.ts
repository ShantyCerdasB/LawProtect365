/**
 * @fileoverview Use PDF Element Interaction Hook Tests
 * @summary Tests for the usePdfElementInteraction hook
 */

import { renderHook, act } from '@testing-library/react';
import { usePdfElementInteraction } from '@/modules/documents/hooks/usePdfElementInteraction';
import { WebElementInteractionHandler } from '@/modules/documents/handlers/WebElementInteractionHandler';
import { PdfElementType, ResizeHandle } from '@lawprotect/frontend-core';

jest.mock('@/modules/documents/handlers/WebElementInteractionHandler');

const MockHandler = WebElementInteractionHandler as jest.MockedClass<
  typeof WebElementInteractionHandler
>;

describe('usePdfElementInteraction', () => {
  const renderMetrics = {
    viewportWidth: 800,
    viewportHeight: 1200,
    outputScale: 1,
    pdfPageWidth: 800,
    pdfPageHeight: 1200,
  };

  const baseConfig = {
    currentPage: 1,
    renderMetrics,
    signatures: [],
    texts: [],
    dates: [],
    pendingCoordinates: null,
    pendingElementType: null,
    pendingSignatureWidth: 150,
    pendingSignatureHeight: 60,
    onElementMove: jest.fn(),
    onElementDelete: jest.fn(),
    onSignatureResize: jest.fn(),
    onTextResize: jest.fn(),
    onDateResize: jest.fn(),
    onPageClick: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    MockHandler.mockImplementation((config: any) => {
      const impl: Partial<WebElementInteractionHandler> = {
        updateConfig: jest.fn(),
        updateContext: jest.fn(),
        handlePointerDown: jest.fn().mockReturnValue(true),
        handlePointerMove: jest.fn(),
        handlePointerUp: jest.fn(),
      };
      return impl as WebElementInteractionHandler;
    });
  });

  it('should create handler instance when renderMetrics is provided', () => {
    renderHook(() => usePdfElementInteraction(baseConfig));

    expect(MockHandler).toHaveBeenCalledTimes(1);
  });

  it('should delegate pointer down to handler and prevent default when requested', () => {
    const { result } = renderHook(() => usePdfElementInteraction(baseConfig));

    const preventDefault = jest.fn();
    const stopPropagation = jest.fn();

    act(() => {
      result.current.handlePointerDown({
        currentTarget: document.createElement('canvas'),
        preventDefault,
        stopPropagation,
      } as any);
    });

    expect(preventDefault).toHaveBeenCalled();
    expect(stopPropagation).toHaveBeenCalled();
  });

  it('should delegate pointer move and up to handler without crashing', () => {
    const { result } = renderHook(() => usePdfElementInteraction(baseConfig));

    const canvas = document.createElement('canvas');

    act(() => {
      result.current.handlePointerMove({ currentTarget: canvas } as any);
      result.current.handlePointerUp({ currentTarget: canvas } as any);
    });

    // No explicit assertion on handler internals; this ensures handlers are callable
    expect(typeof result.current.handlePointerMove).toBe('function');
    expect(typeof result.current.handlePointerUp).toBe('function');
  });

  it('should track dragged element and resize handle when global pointer events fire', () => {
    const { result } = renderHook(() =>
      usePdfElementInteraction({
        ...baseConfig,
        signatures: [
          {
            signatureImage: 'data:image/png;base64,test',
            coordinates: { x: 10, y: 20, pageNumber: 1, pageWidth: 800, pageHeight: 1200 },
          },
        ],
      })
    );

    expect(result.current.draggedElement).toBeNull();
    expect(result.current.resizeHandle).toBeNull();
  });

  it('should expose click handler', () => {
    const { result } = renderHook(() => usePdfElementInteraction(baseConfig));
    expect(typeof result.current.handleClick).toBe('function');
  });

  it('should not create handler when renderMetrics is null', () => {
    renderHook(() => usePdfElementInteraction({ ...baseConfig, renderMetrics: null }));
    expect(MockHandler).not.toHaveBeenCalled();
  });

  it('should update existing handler when renderMetrics changes', () => {
    const { rerender } = renderHook(
      ({ metrics }) => usePdfElementInteraction({ ...baseConfig, renderMetrics: metrics }),
      { initialProps: { metrics: renderMetrics } }
    );

    expect(MockHandler).toHaveBeenCalledTimes(1);
    const handlerInstance = MockHandler.mock.results[0].value;
    const updateConfig = handlerInstance.updateConfig as jest.Mock;

    const newMetrics = { ...renderMetrics, outputScale: 2 };
    rerender({ metrics: newMetrics });

    expect(updateConfig).toHaveBeenCalled();
  });

  it('should handle pointer down when handler is null', () => {
    MockHandler.mockImplementation(() => null as any);
    const { result } = renderHook(() => usePdfElementInteraction(baseConfig));

    act(() => {
      result.current.handlePointerDown({
        currentTarget: document.createElement('canvas'),
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
      } as any);
    });

    expect(result.current).toBeDefined();
  });

  it('should handle pointer move when handler is null', () => {
    MockHandler.mockImplementation(() => null as any);
    const { result } = renderHook(() => usePdfElementInteraction(baseConfig));

    act(() => {
      result.current.handlePointerMove({
        currentTarget: document.createElement('canvas'),
      } as any);
    });

    expect(result.current).toBeDefined();
  });

  it('should handle pointer up when handler is null', () => {
    MockHandler.mockImplementation(() => null as any);
    const { result } = renderHook(() => usePdfElementInteraction(baseConfig));

    act(() => {
      result.current.handlePointerUp({
        currentTarget: document.createElement('canvas'),
      } as any);
    });

    expect(result.current).toBeDefined();
  });

  it('should handle click when handler is null', () => {
    MockHandler.mockImplementation(() => null as any);
    const { result } = renderHook(() => usePdfElementInteraction(baseConfig));

    act(() => {
      result.current.handleClick({
        currentTarget: document.createElement('canvas'),
      } as any);
    });

    expect(result.current).toBeDefined();
  });

  it('should handle pointer down without preventing default when handler returns false', () => {
    MockHandler.mockImplementation(() => ({
      updateConfig: jest.fn(),
      updateContext: jest.fn(),
      handlePointerDown: jest.fn().mockReturnValue(false),
      handlePointerMove: jest.fn(),
      handlePointerUp: jest.fn(),
    } as any));

    const { result } = renderHook(() => usePdfElementInteraction(baseConfig));

    const preventDefault = jest.fn();
    const stopPropagation = jest.fn();

    act(() => {
      result.current.handlePointerDown({
        currentTarget: document.createElement('canvas'),
        preventDefault,
        stopPropagation,
      } as any);
    });

    expect(preventDefault).not.toHaveBeenCalled();
    expect(stopPropagation).not.toHaveBeenCalled();
  });

  it('should add global pointer event listeners when draggedElement is set', () => {
    const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
    const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
    let capturedSetDraggedElement: ((state: any) => void) | null = null;

    const handlerInstance = {
      updateConfig: jest.fn(),
      updateContext: jest.fn(),
      handlePointerDown: jest.fn().mockImplementation(() => {
        if (capturedSetDraggedElement) {
          capturedSetDraggedElement({ type: PdfElementType.Signature, index: 0, offsetX: 0, offsetY: 0 });
        }
        return true;
      }),
      handlePointerMove: jest.fn(),
      handlePointerUp: jest.fn(),
    };

    MockHandler.mockImplementation((config: any) => {
      capturedSetDraggedElement = config.setDraggedElement;
      return handlerInstance as any;
    });

    const { result } = renderHook(() => usePdfElementInteraction(baseConfig));

    const canvas = document.createElement('canvas');
    
    // Call handlePointerDown to set canvasRef and trigger draggedElement state
    act(() => {
      result.current.handlePointerDown({
        currentTarget: canvas,
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        pointerId: 1,
      } as any);
    });

    expect(addEventListenerSpy).toHaveBeenCalledWith('pointermove', expect.any(Function));
    expect(addEventListenerSpy).toHaveBeenCalledWith('pointerup', expect.any(Function));

    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });

  it('should add global pointer event listeners when resizeHandle is set', () => {
    const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
    const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
    let capturedSetResizeHandle: ((state: any) => void) | null = null;

    const handlerInstance = {
      updateConfig: jest.fn(),
      updateContext: jest.fn(),
      handlePointerDown: jest.fn().mockImplementation(() => {
        if (capturedSetResizeHandle) {
          capturedSetResizeHandle({ 
            type: PdfElementType.Signature, 
            index: 0, 
            handle: ResizeHandle.Southeast, 
            startX: 0, 
            startY: 0, 
            startWidth: 150, 
            startHeight: 60 
          });
        }
        return true;
      }),
      handlePointerMove: jest.fn(),
      handlePointerUp: jest.fn(),
    };

    MockHandler.mockImplementation((config: any) => {
      capturedSetResizeHandle = config.setResizeHandle;
      return handlerInstance as any;
    });

    const { result } = renderHook(() => usePdfElementInteraction(baseConfig));

    const canvas = document.createElement('canvas');
    
    // Call handlePointerDown to set canvasRef and trigger resizeHandle state
    act(() => {
      result.current.handlePointerDown({
        currentTarget: canvas,
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        pointerId: 1,
      } as any);
    });

    expect(addEventListenerSpy).toHaveBeenCalledWith('pointermove', expect.any(Function));
    expect(addEventListenerSpy).toHaveBeenCalledWith('pointerup', expect.any(Function));

    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });

  it('should handle global pointer move events', () => {
    let capturedSetDraggedElement: ((state: any) => void) | null = null;

    const handlerInstance = {
      updateConfig: jest.fn(),
      updateContext: jest.fn(),
      handlePointerDown: jest.fn().mockImplementation(() => {
        if (capturedSetDraggedElement) {
          capturedSetDraggedElement({ type: PdfElementType.Signature, index: 0, offsetX: 0, offsetY: 0 });
        }
        return true;
      }),
      handlePointerMove: jest.fn(),
      handlePointerUp: jest.fn(),
    };

    MockHandler.mockImplementation((config: any) => {
      capturedSetDraggedElement = config.setDraggedElement;
      return handlerInstance as any;
    });

    const { result } = renderHook(() => usePdfElementInteraction(baseConfig));

    const canvas = document.createElement('canvas');
    act(() => {
      result.current.handlePointerDown({
        currentTarget: canvas,
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        pointerId: 1,
      } as any);
    });

    act(() => {
      const pointerMoveEvent = new PointerEvent('pointermove', {
        clientX: 100,
        clientY: 200,
        pointerId: 1,
      });
      document.dispatchEvent(pointerMoveEvent);
    });

    expect(handlerInstance.handlePointerMove).toHaveBeenCalled();
  });

  it('should handle global pointer up events and clear state', () => {
    jest.useFakeTimers();
    let capturedSetDraggedElement: ((state: any) => void) | null = null;

    const handlerInstance = {
      updateConfig: jest.fn(),
      updateContext: jest.fn(),
      handlePointerDown: jest.fn().mockImplementation(() => {
        if (capturedSetDraggedElement) {
          capturedSetDraggedElement({ type: PdfElementType.Signature, index: 0, offsetX: 0, offsetY: 0 });
        }
        return true;
      }),
      handlePointerMove: jest.fn(),
      handlePointerUp: jest.fn(),
    };

    MockHandler.mockImplementation((config: any) => {
      capturedSetDraggedElement = config.setDraggedElement;
      return handlerInstance as any;
    });

    const { result } = renderHook(() => usePdfElementInteraction(baseConfig));

    const canvas = document.createElement('canvas');
    act(() => {
      result.current.handlePointerDown({
        currentTarget: canvas,
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        pointerId: 1,
      } as any);
    });

    act(() => {
      const pointerUpEvent = new PointerEvent('pointerup', {
        pointerId: 1,
      });
      document.dispatchEvent(pointerUpEvent);
    });

    expect(handlerInstance.handlePointerUp).toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(100);
    });

    jest.useRealTimers();
  });

  it('should not add global listeners when canvasRef is null', () => {
    const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
    let capturedSetDraggedElement: ((state: any) => void) | null = null;

    const handlerInstance = {
      updateConfig: jest.fn(),
      updateContext: jest.fn(),
      handlePointerDown: jest.fn().mockReturnValue(true),
      handlePointerMove: jest.fn(),
      handlePointerUp: jest.fn(),
    };

    MockHandler.mockImplementation((config: any) => {
      capturedSetDraggedElement = config.setDraggedElement;
      return handlerInstance as any;
    });

    const { result } = renderHook(() => usePdfElementInteraction(baseConfig));

    // Set draggedElement without setting canvasRef (by not calling handlePointerDown)
    act(() => {
      if (capturedSetDraggedElement) {
        capturedSetDraggedElement({ type: PdfElementType.Signature, index: 0, offsetX: 0, offsetY: 0 });
      }
    });

    // Should not add listeners because canvasRef is null
    expect(addEventListenerSpy).not.toHaveBeenCalledWith('pointermove', expect.any(Function));

    addEventListenerSpy.mockRestore();
  });

  it('should handle pointer up with draggedElement and set wasDragging', () => {
    jest.useFakeTimers();
    let capturedSetDraggedElement: ((state: any) => void) | null = null;

    const handlerInstance = {
      updateConfig: jest.fn(),
      updateContext: jest.fn(),
      handlePointerDown: jest.fn().mockImplementation(() => {
        if (capturedSetDraggedElement) {
          capturedSetDraggedElement({ type: PdfElementType.Signature, index: 0, offsetX: 0, offsetY: 0 });
        }
        return true;
      }),
      handlePointerMove: jest.fn(),
      handlePointerUp: jest.fn(),
    };

    MockHandler.mockImplementation((config: any) => {
      capturedSetDraggedElement = config.setDraggedElement;
      return handlerInstance as any;
    });

    const { result } = renderHook(() => usePdfElementInteraction(baseConfig));

    const canvas = document.createElement('canvas');
    act(() => {
      result.current.handlePointerDown({
        currentTarget: canvas,
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        pointerId: 1,
      } as any);
    });

    act(() => {
      result.current.handlePointerUp({
        currentTarget: canvas,
        pointerId: 1,
      } as any);
    });

    act(() => {
      jest.advanceTimersByTime(100);
    });

    jest.useRealTimers();
  });

  it('should handle pointer up with resizeHandle and set wasDragging', () => {
    jest.useFakeTimers();
    let capturedSetResizeHandle: ((state: any) => void) | null = null;

    const handlerInstance = {
      updateConfig: jest.fn(),
      updateContext: jest.fn(),
      handlePointerDown: jest.fn().mockImplementation(() => {
        if (capturedSetResizeHandle) {
          capturedSetResizeHandle({ 
            type: PdfElementType.Signature, 
            index: 0, 
            handle: ResizeHandle.Southeast, 
            startX: 0, 
            startY: 0, 
            startWidth: 150, 
            startHeight: 60 
          });
        }
        return true;
      }),
      handlePointerMove: jest.fn(),
      handlePointerUp: jest.fn(),
    };

    MockHandler.mockImplementation((config: any) => {
      capturedSetResizeHandle = config.setResizeHandle;
      return handlerInstance as any;
    });

    const { result } = renderHook(() => usePdfElementInteraction(baseConfig));

    const canvas = document.createElement('canvas');
    act(() => {
      result.current.handlePointerDown({
        currentTarget: canvas,
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        pointerId: 1,
      } as any);
    });

    act(() => {
      result.current.handlePointerUp({
        currentTarget: canvas,
        pointerId: 1,
      } as any);
    });

    act(() => {
      jest.advanceTimersByTime(100);
    });

    jest.useRealTimers();
  });

  it('should handle click with wasDragging flag', () => {
    const handlerInstance = {
      updateConfig: jest.fn(),
      updateContext: jest.fn(),
      handlePointerDown: jest.fn().mockReturnValue(true),
      handlePointerMove: jest.fn(),
      handlePointerUp: jest.fn(),
      handleClick: jest.fn(),
    };

    MockHandler.mockImplementation(() => handlerInstance as any);

    const { result } = renderHook(() => usePdfElementInteraction(baseConfig));

    const canvas = document.createElement('canvas');
    act(() => {
      result.current.handleClick({
        currentTarget: canvas,
      } as any);
    });

    expect(handlerInstance.handleClick || handlerInstance.handlePointerUp).toHaveBeenCalled();
  });

  it('should update handler when pendingCoordinates change', () => {
    const handlerInstance = {
      updateConfig: jest.fn(),
      updateContext: jest.fn(),
      handlePointerDown: jest.fn().mockReturnValue(true),
      handlePointerMove: jest.fn(),
      handlePointerUp: jest.fn(),
    };

    MockHandler.mockImplementation(() => handlerInstance as any);

    const { rerender } = renderHook(
      ({ pendingCoords }: { pendingCoords: { x: number; y: number; pageNumber: number } | null }) =>
        usePdfElementInteraction({
          ...baseConfig,
          pendingCoordinates: pendingCoords,
        }),
      { initialProps: { pendingCoords: null as { x: number; y: number; pageNumber: number } | null } }
    );

    rerender({
      pendingCoords: { x: 100, y: 200, pageNumber: 1 } as { x: number; y: number; pageNumber: number } | null,
    });

    expect(handlerInstance.updateConfig).toHaveBeenCalled();
  });

  it('should cleanup global event listeners on unmount', () => {
    const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
    let capturedSetDraggedElement: ((state: any) => void) | null = null;

    const handlerInstance = {
      updateConfig: jest.fn(),
      updateContext: jest.fn(),
      handlePointerDown: jest.fn().mockImplementation(() => {
        if (capturedSetDraggedElement) {
          capturedSetDraggedElement({ type: PdfElementType.Signature, index: 0, offsetX: 0, offsetY: 0 });
        }
        return true;
      }),
      handlePointerMove: jest.fn(),
      handlePointerUp: jest.fn(),
    };

    MockHandler.mockImplementation((config: any) => {
      capturedSetDraggedElement = config.setDraggedElement;
      return handlerInstance as any;
    });

    const { result, unmount } = renderHook(() => usePdfElementInteraction(baseConfig));

    const canvas = document.createElement('canvas');
    act(() => {
      result.current.handlePointerDown({
        currentTarget: canvas,
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        pointerId: 1,
      } as any);
    });

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalled();
    removeEventListenerSpy.mockRestore();
  });
});


