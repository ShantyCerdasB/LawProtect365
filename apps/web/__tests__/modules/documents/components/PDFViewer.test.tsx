// @ts-nocheck
/**
 * @fileoverview PDF Viewer Component Tests
 * @summary Tests for the PDFViewer component
 */

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/__tests__/helpers';
import { PDFViewer } from '@/modules/documents/components/PDFViewer';
import { PdfElementType } from '@lawprotect/frontend-core';

jest.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: {
    workerSrc: '',
  },
  getDocument: jest.fn(),
}));

jest.mock('@/modules/documents/hooks/usePdfPageRenderer', () => ({
  usePdfPageRenderer: jest.fn(() => ({
    pdfDoc: {} as any,
    currentPageCanvas: {} as any,
    renderMetrics: {
      outputScale: 1,
      viewportScale: 1,
      pageWidth: 800,
      pageHeight: 1200,
    },
    loading: false,
    error: null,
    totalPages: 5,
    renderKey: 0,
  })),
}));

jest.mock('@/modules/documents/hooks/usePdfElementOverlay', () => ({
  usePdfElementOverlay: jest.fn(),
}));

jest.mock('@/modules/documents/hooks/usePdfElementInteraction', () => ({
  usePdfElementInteraction: jest.fn(() => ({
    draggedElement: null,
    resizeHandle: null,
    handlePointerDown: jest.fn(),
    handlePointerMove: jest.fn(),
    handlePointerUp: jest.fn(),
    handleClick: jest.fn(),
  })),
}));

describe('PDFViewer', () => {
  const mockOnPageClick = jest.fn();
  const mockOnElementMove = jest.fn();
  const mockOnElementDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render PDF viewer', () => {
    renderWithProviders(
      <PDFViewer
        pdfSource={new ArrayBuffer(8)}
        onPageClick={mockOnPageClick}
        signatures={[]}
        texts={[]}
        dates={[]}
        onElementMove={mockOnElementMove}
        onElementDelete={mockOnElementDelete}
      />
    );

    expect(screen.getByText(/page 1 of 5/i)).toBeInTheDocument();
  });

  it('should render pagination controls', () => {
    renderWithProviders(
      <PDFViewer
        pdfSource={new ArrayBuffer(8)}
        onPageClick={mockOnPageClick}
        signatures={[]}
        texts={[]}
        dates={[]}
        onElementMove={mockOnElementMove}
        onElementDelete={mockOnElementDelete}
      />
    );

    expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
  });

  it('should render canvas container', () => {
    const { container } = renderWithProviders(
      <PDFViewer
        pdfSource={new ArrayBuffer(8)}
        onPageClick={mockOnPageClick}
        signatures={[]}
        texts={[]}
        dates={[]}
        onElementMove={mockOnElementMove}
        onElementDelete={mockOnElementDelete}
      />
    );

    const canvasContainer = container.querySelector('.bg-white.relative');
    expect(canvasContainer).toBeInTheDocument();
  });

  it('should handle PDF source as ArrayBuffer', () => {
    renderWithProviders(
      <PDFViewer
        pdfSource={new ArrayBuffer(8)}
        onPageClick={mockOnPageClick}
        signatures={[]}
        texts={[]}
        dates={[]}
        onElementMove={mockOnElementMove}
        onElementDelete={mockOnElementDelete}
      />
    );

    expect(screen.getByText(/page 1 of 5/i)).toBeInTheDocument();
  });

  it('should handle pending signature coordinates', () => {
    renderWithProviders(
      <PDFViewer
        pdfSource={new ArrayBuffer(8)}
        onPageClick={mockOnPageClick}
        signatures={[]}
        texts={[]}
        dates={[]}
        pendingCoordinates={{ x: 100, y: 200, pageNumber: 1, pageWidth: 800, pageHeight: 1200 }}
        pendingElementType={PdfElementType.Signature}
        pendingSignatureImage="data:image/png;base64,test"
        onElementMove={mockOnElementMove}
        onElementDelete={mockOnElementDelete}
      />
    );

    expect(screen.getByText(/page 1 of 5/i)).toBeInTheDocument();
  });

  it('should handle pending text coordinates', () => {
    renderWithProviders(
      <PDFViewer
        pdfSource={new ArrayBuffer(8)}
        onPageClick={mockOnPageClick}
        signatures={[]}
        texts={[]}
        dates={[]}
        pendingCoordinates={{ x: 100, y: 200, pageNumber: 1, pageWidth: 800, pageHeight: 1200 }}
        pendingElementType={PdfElementType.Text}
        pendingText="Test text"
        onElementMove={mockOnElementMove}
        onElementDelete={mockOnElementDelete}
      />
    );

    expect(screen.getByText(/page 1 of 5/i)).toBeInTheDocument();
  });

  it('should handle pending date coordinates', () => {
    renderWithProviders(
      <PDFViewer
        pdfSource={new ArrayBuffer(8)}
        onPageClick={mockOnPageClick}
        signatures={[]}
        texts={[]}
        dates={[]}
        pendingCoordinates={{ x: 100, y: 200, pageNumber: 1, pageWidth: 800, pageHeight: 1200 }}
        pendingElementType={PdfElementType.Date}
        pendingDate={new Date()}
        onElementMove={mockOnElementMove}
        onElementDelete={mockOnElementDelete}
      />
    );

    expect(screen.getByText(/page 1 of 5/i)).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = renderWithProviders(
      <PDFViewer
        pdfSource={new ArrayBuffer(8)}
        onPageClick={mockOnPageClick}
        signatures={[]}
        texts={[]}
        dates={[]}
        className="custom-viewer"
        onElementMove={mockOnElementMove}
        onElementDelete={mockOnElementDelete}
      />
    );

    const viewer = container.querySelector('.custom-viewer');
    expect(viewer).toBeInTheDocument();
  });

  it('should handle empty signatures, texts, and dates arrays', () => {
    renderWithProviders(
      <PDFViewer
        pdfSource={new ArrayBuffer(8)}
        onPageClick={mockOnPageClick}
        signatures={[]}
        texts={[]}
        dates={[]}
        onElementMove={mockOnElementMove}
        onElementDelete={mockOnElementDelete}
      />
    );

    expect(screen.getByText(/page 1 of 5/i)).toBeInTheDocument();
  });

  it('should display loading state', () => {
    jest.spyOn(require('@/modules/documents/hooks/usePdfPageRenderer'), 'usePdfPageRenderer').mockReturnValue({
      pdfDoc: null,
      currentPageCanvas: null,
      renderMetrics: null,
      loading: true,
      error: null,
      totalPages: 0,
      renderKey: 0,
    });

    renderWithProviders(
      <PDFViewer
        pdfSource={new ArrayBuffer(8)}
        onPageClick={mockOnPageClick}
        signatures={[]}
        texts={[]}
        dates={[]}
        onElementMove={mockOnElementMove}
        onElementDelete={mockOnElementDelete}
      />
    );

    expect(screen.getByText(/loading pdf/i)).toBeInTheDocument();
  });

  it('should display error state', () => {
    jest.spyOn(require('@/modules/documents/hooks/usePdfPageRenderer'), 'usePdfPageRenderer').mockReturnValue({
      pdfDoc: null,
      currentPageCanvas: null,
      renderMetrics: null,
      loading: false,
      error: 'Failed to load PDF',
      totalPages: 0,
      renderKey: 0,
    });

    renderWithProviders(
      <PDFViewer
        pdfSource={new ArrayBuffer(8)}
        onPageClick={mockOnPageClick}
        signatures={[]}
        texts={[]}
        dates={[]}
        onElementMove={mockOnElementMove}
        onElementDelete={mockOnElementDelete}
      />
    );

    expect(screen.getByText(/error: failed to load pdf/i)).toBeInTheDocument();
  });

  it('should display no PDF loaded when pdfDoc is null', () => {
    jest.spyOn(require('@/modules/documents/hooks/usePdfPageRenderer'), 'usePdfPageRenderer').mockReturnValue({
      pdfDoc: null,
      currentPageCanvas: null,
      renderMetrics: null,
      loading: false,
      error: null,
      totalPages: 0,
      renderKey: 0,
    });

    renderWithProviders(
      <PDFViewer
        pdfSource={new ArrayBuffer(8)}
        onPageClick={mockOnPageClick}
        signatures={[]}
        texts={[]}
        dates={[]}
        onElementMove={mockOnElementMove}
        onElementDelete={mockOnElementDelete}
      />
    );

    expect(screen.getByText(/no pdf loaded/i)).toBeInTheDocument();
  });

  it('should display loading when pdfDoc exists but canvas is null', () => {
    jest.spyOn(require('@/modules/documents/hooks/usePdfPageRenderer'), 'usePdfPageRenderer').mockReturnValue({
      pdfDoc: {} as any,
      currentPageCanvas: null,
      renderMetrics: null,
      loading: true,
      error: null,
      totalPages: 5,
      renderKey: 0,
    });

    renderWithProviders(
      <PDFViewer
        pdfSource={new ArrayBuffer(8)}
        onPageClick={mockOnPageClick}
        signatures={[]}
        texts={[]}
        dates={[]}
        onElementMove={mockOnElementMove}
        onElementDelete={mockOnElementDelete}
      />
    );

    expect(screen.getByText(/loading pdf/i)).toBeInTheDocument();
  });

  it('should handle previous page navigation', async () => {
    const user = userEvent.setup();
    const { usePdfPageRenderer } = require('@/modules/documents/hooks/usePdfPageRenderer');
    const mockSetCurrentPage = jest.fn();
    let currentPage = 2;
    jest.spyOn(require('@/modules/documents/hooks/usePdfPageRenderer'), 'usePdfPageRenderer').mockImplementation(() => {
      return {
        pdfDoc: {} as any,
        currentPageCanvas: {} as any,
        renderMetrics: {
          outputScale: 1,
          viewportWidth: 800,
          viewportHeight: 1200,
          pdfPageWidth: 800,
          pdfPageHeight: 1200,
        },
        loading: false,
        error: null,
        totalPages: 5,
        renderKey: 0,
      };
    });

    renderWithProviders(
      <PDFViewer
        pdfSource={new ArrayBuffer(8)}
        onPageClick={mockOnPageClick}
        signatures={[]}
        texts={[]}
        dates={[]}
        onElementMove={mockOnElementMove}
        onElementDelete={mockOnElementDelete}
      />
    );

    const previousButton = screen.getByRole('button', { name: /previous/i });
    await user.click(previousButton);

    expect(screen.getByText(/page 1 of 5/i)).toBeInTheDocument();
  });

  it('should handle next page navigation', async () => {
    const user = userEvent.setup();
    jest.spyOn(require('@/modules/documents/hooks/usePdfPageRenderer'), 'usePdfPageRenderer').mockReturnValue({
      pdfDoc: {} as any,
      currentPageCanvas: {} as any,
      renderMetrics: {
        outputScale: 1,
        viewportWidth: 800,
        viewportHeight: 1200,
        pdfPageWidth: 800,
        pdfPageHeight: 1200,
      },
      loading: false,
      error: null,
      totalPages: 5,
      renderKey: 0,
    });

    renderWithProviders(
      <PDFViewer
        pdfSource={new ArrayBuffer(8)}
        onPageClick={mockOnPageClick}
        signatures={[]}
        texts={[]}
        dates={[]}
        onElementMove={mockOnElementMove}
        onElementDelete={mockOnElementDelete}
      />
    );

    const nextButton = screen.getByRole('button', { name: /next/i });
    await user.click(nextButton);

    expect(screen.getByText(/page 2 of 5/i)).toBeInTheDocument();
  });
});


