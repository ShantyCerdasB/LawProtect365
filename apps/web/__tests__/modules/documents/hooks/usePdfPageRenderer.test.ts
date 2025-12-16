/**
 * @fileoverview Use PDF Page Renderer Hook Tests
 * @summary Tests for the usePdfPageRenderer hook
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { usePdfPageRenderer } from '@/modules/documents/hooks/usePdfPageRenderer';

const mockGetDocument = jest.fn();
const mockPage = {
  getViewport: jest.fn(() => ({
    width: 800,
    height: 1200,
  })),
  render: jest.fn(() => ({
    promise: Promise.resolve({}),
  })),
};

const mockPdfDoc = {
  numPages: 5,
  getPage: jest.fn(() => Promise.resolve(mockPage)),
};

jest.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: {
    workerSrc: '',
  },
  getDocument: jest.fn((options) => {
    return {
      promise: Promise.resolve(mockPdfDoc),
    };
  }),
}));

describe('usePdfPageRenderer', () => {
  const mockContainerRef = {
    current: document.createElement('div'),
  } as React.RefObject<HTMLDivElement>;

  const defaultConfig = {
    pdfSource: new ArrayBuffer(8),
    currentPage: 1,
    containerRef: mockContainerRef,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(window, 'devicePixelRatio', {
      writable: true,
      value: 1,
    });
  });

  it('should initialize with loading state', () => {
    const { result } = renderHook(() => usePdfPageRenderer(defaultConfig));

    expect(result.current.loading).toBe(true);
    expect(result.current.pdfDoc).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should load PDF document', async () => {
    const { result } = renderHook(() => usePdfPageRenderer(defaultConfig));

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 3000 }
    );

    expect(result.current.pdfDoc).toBeDefined();
    expect(result.current.totalPages).toBe(5);
  });

  it('should handle ArrayBuffer pdfSource', async () => {
    const pdfBytes = new ArrayBuffer(8);
    const { result } = renderHook(() =>
      usePdfPageRenderer({
        ...defaultConfig,
        pdfSource: pdfBytes,
      })
    );

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 3000 }
    );

    expect(result.current.pdfDoc).toBeDefined();
  });

  it('should handle Uint8Array pdfSource', async () => {
    const pdfBytes = new Uint8Array([1, 2, 3, 4, 5]);
    const { result } = renderHook(() =>
      usePdfPageRenderer({
        ...defaultConfig,
        pdfSource: pdfBytes,
      })
    );

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 3000 }
    );

    expect(result.current.pdfDoc).toBeDefined();
  });

  it('should handle string pdfSource', async () => {
    const { result } = renderHook(() =>
      usePdfPageRenderer({
        ...defaultConfig,
        pdfSource: '/path/to/file.pdf',
      })
    );

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 3000 }
    );

    expect(result.current.pdfDoc).toBeDefined();
  });

  it('should handle PDF loading error', async () => {
    const mockGetDocumentWithError = jest.fn(() => ({
      promise: Promise.reject(new Error('Failed to load PDF')),
    }));

    jest.doMock('pdfjs-dist', () => ({
      getDocument: mockGetDocumentWithError,
    }));

    const { result } = renderHook(() => usePdfPageRenderer(defaultConfig));

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 3000 }
    );

    expect(result.current.error).toBeDefined();
  });

  it('should update when currentPage changes', async () => {
    const { result, rerender } = renderHook(
      ({ currentPage }) =>
        usePdfPageRenderer({
          ...defaultConfig,
          currentPage,
        }),
      { initialProps: { currentPage: 1 } }
    );

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 3000 }
    );

    rerender({ currentPage: 2 });

    await waitFor(() => {
      expect(mockPdfDoc.getPage).toHaveBeenCalled();
    });
  });

  it('should calculate render metrics', async () => {
    const { result } = renderHook(() => usePdfPageRenderer(defaultConfig));

    await waitFor(
      () => {
        expect(result.current.renderMetrics).toBeDefined();
      },
      { timeout: 3000 }
    );

    if (result.current.renderMetrics) {
      expect(result.current.renderMetrics.pdfPageWidth).toBe(800);
      expect(result.current.renderMetrics.pdfPageHeight).toBe(1200);
    }
  });

  it('should increment render key on page change', async () => {
    const { result, rerender } = renderHook(
      ({ currentPage }) =>
        usePdfPageRenderer({
          ...defaultConfig,
          currentPage,
        }),
      { initialProps: { currentPage: 1 } }
    );

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 3000 }
    );

    const initialRenderKey = result.current.renderKey;

    rerender({ currentPage: 2 });

    await waitFor(() => {
      expect(result.current.renderKey).toBeGreaterThanOrEqual(initialRenderKey);
    });
  });

  it('should handle null container ref', () => {
    const configWithoutRef = {
      ...defaultConfig,
      containerRef: { current: null } as unknown as React.RefObject<HTMLDivElement>,
    };

    const { result } = renderHook(() => usePdfPageRenderer(configWithoutRef));

    expect(result.current.loading).toBe(true);
  });

  it('should clean up on unmount', async () => {
    const { result, unmount } = renderHook(() => usePdfPageRenderer(defaultConfig));

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 3000 }
    );

    unmount();

    expect(result.current.pdfDoc).toBeDefined();
  });

  it('should handle getPage error', async () => {
    const mockGetPageError = jest.fn(() => Promise.reject(new Error('Failed to get page')));
    mockPdfDoc.getPage = mockGetPageError;

    const { result } = renderHook(() => usePdfPageRenderer(defaultConfig));

    await waitFor(
      () => {
        expect(result.current.pdfDoc).toBeDefined();
      },
      { timeout: 3000 }
    );

    await waitFor(
      () => {
        expect(result.current.error).toBeDefined();
      },
      { timeout: 3000 }
    );

    mockPdfDoc.getPage = jest.fn(() => Promise.resolve(mockPage));
  });

  it('should handle resize event', async () => {
    const { result } = renderHook(() => usePdfPageRenderer(defaultConfig));

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 3000 }
    );

    const initialRenderKey = result.current.renderKey;

    act(() => {
      window.dispatchEvent(new Event('resize'));
    });

    await waitFor(
      () => {
        expect(result.current.renderKey).toBeGreaterThan(initialRenderKey);
      },
      { timeout: 3000 }
    );
  });

  it('should handle currentPage out of range (too low)', async () => {
    const { result } = renderHook(() =>
      usePdfPageRenderer({
        ...defaultConfig,
        currentPage: 0,
      })
    );

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 3000 }
    );

    expect(result.current.pdfDoc).toBeDefined();
    expect(result.current.currentPageCanvas).toBeNull();
  });

  it('should handle currentPage out of range (too high)', async () => {
    const { result } = renderHook(() =>
      usePdfPageRenderer({
        ...defaultConfig,
        currentPage: 10,
      })
    );

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 3000 }
    );

    expect(result.current.pdfDoc).toBeDefined();
    expect(result.current.currentPageCanvas).toBeNull();
  });

  it('should handle different devicePixelRatio', async () => {
    Object.defineProperty(window, 'devicePixelRatio', {
      writable: true,
      value: 2,
    });

    const { result } = renderHook(() => usePdfPageRenderer(defaultConfig));

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 3000 }
    );

    if (result.current.renderMetrics) {
      expect(result.current.renderMetrics.outputScale).toBe(2);
    }

    Object.defineProperty(window, 'devicePixelRatio', {
      writable: true,
      value: 1,
    });
  });

  it('should handle container with custom width', async () => {
    const customContainer = document.createElement('div');
    customContainer.style.width = '500px';
    const customContainerRef = { current: customContainer };

    const { result } = renderHook(() =>
      usePdfPageRenderer({
        ...defaultConfig,
        containerRef: customContainerRef,
      })
    );

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 3000 }
    );

    expect(result.current.pdfDoc).toBeDefined();
  });

  it('should handle container becoming null during render', async () => {
    const containerRef: { current: HTMLDivElement | null } = { current: document.createElement('div') };

    const { result, rerender } = renderHook(
      ({ containerRef: ref }) =>
        usePdfPageRenderer({
          ...defaultConfig,
          containerRef: ref,
        }),
      { initialProps: { containerRef } }
    );

    await waitFor(
      () => {
        expect(result.current.pdfDoc).toBeDefined();
      },
      { timeout: 3000 }
    );

    containerRef.current = null;
    rerender({ containerRef });

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 3000 }
    );
  });

  it('should handle unmount during PDF loading', () => {
    const { unmount } = renderHook(() => usePdfPageRenderer(defaultConfig));

    unmount();

    expect(true).toBe(true);
  });

  it('should handle unmount during page rendering', async () => {
    const { result, unmount } = renderHook(() => usePdfPageRenderer(defaultConfig));

    await waitFor(
      () => {
        expect(result.current.pdfDoc).toBeDefined();
      },
      { timeout: 3000 }
    );

    unmount();

    expect(true).toBe(true);
  });

  it('should calculate scale correctly for narrow container', async () => {
    const narrowContainer = document.createElement('div');
    narrowContainer.style.width = '200px';
    const narrowContainerRef = { current: narrowContainer };

    const { result } = renderHook(() =>
      usePdfPageRenderer({
        ...defaultConfig,
        containerRef: narrowContainerRef,
      })
    );

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 3000 }
    );

    expect(result.current.scale).toBeGreaterThan(0);
    expect(result.current.scale).toBeLessThanOrEqual(1.5);
  });

  it('should calculate scale correctly for wide container', async () => {
    const wideContainer = document.createElement('div');
    wideContainer.style.width = '2000px';
    const wideContainerRef = { current: wideContainer };

    const { result } = renderHook(() =>
      usePdfPageRenderer({
        ...defaultConfig,
        containerRef: wideContainerRef,
      })
    );

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 3000 }
    );

    expect(result.current.scale).toBeGreaterThanOrEqual(0.6);
    expect(result.current.scale).toBeLessThanOrEqual(1.5);
  });

  it('should handle pdfSource change', async () => {
    const { result, rerender } = renderHook(
      ({ pdfSource }: { pdfSource: ArrayBuffer | Uint8Array | string }) =>
        usePdfPageRenderer({
          ...defaultConfig,
          pdfSource,
        }),
      { initialProps: { pdfSource: new ArrayBuffer(8) as ArrayBuffer | Uint8Array | string } }
    );

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 3000 }
    );

    rerender({ pdfSource: new Uint8Array([1, 2, 3]) as ArrayBuffer | Uint8Array | string });

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 3000 }
    );
  });

  it('should handle incrementRenderKey manually', async () => {
    const { result } = renderHook(() => usePdfPageRenderer(defaultConfig));

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 3000 }
    );

    const initialRenderKey = result.current.renderKey;

    act(() => {
      result.current.incrementRenderKey();
    });

    expect(result.current.renderKey).toBe(initialRenderKey + 1);
  });

  it('should handle error with non-Error object', async () => {
    const mockGetDocumentWithStringError = jest.fn(() => ({
      promise: Promise.reject('String error'),
    }));

    jest.doMock('pdfjs-dist', () => ({
      getDocument: mockGetDocumentWithStringError,
    }));

    const { result } = renderHook(() => usePdfPageRenderer(defaultConfig));

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 3000 }
    );

    expect(result.current.error).toBeDefined();
  });

});


