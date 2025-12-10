/**
 * @fileoverview Use PDF Page Renderer - Hook for rendering PDF pages with pdfjs-dist
 * @summary React hook for loading and rendering PDF pages on canvas
 * @description
 * Manages PDF document loading, page rendering, and canvas creation using pdfjs-dist.
 * Handles scaling, devicePixelRatio, and window resize events. This is a web-specific hook.
 */

import { useEffect, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import type {
  PdfPageRenderMetrics,
  UsePdfPageRendererResult,
  UsePdfPageRendererConfig,
} from '../interfaces';

/**
 * @description Hook for rendering PDF pages with pdfjs-dist.
 * @param config PDF source, current page, and container ref
 * @returns PDF document, canvas, metrics, and state
 */
export function usePdfPageRenderer({
  pdfSource,
  currentPage,
  containerRef,
}: UsePdfPageRendererConfig): UsePdfPageRendererResult {
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [currentPageCanvas, setCurrentPageCanvas] = useState<HTMLCanvasElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(1.0);
  const [renderMetrics, setRenderMetrics] = useState<PdfPageRenderMetrics | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [renderKey, setRenderKey] = useState(0);

  const incrementRenderKey = () => {
    setRenderKey((prev) => prev + 1);
  };

  useEffect(() => {
    let isMounted = true;

    async function loadPDF() {
      try {
        setLoading(true);
        setError(null);

        let pdfData: ArrayBuffer | Uint8Array | string;
        if (pdfSource instanceof ArrayBuffer) {
          const uint8Copy = new Uint8Array(pdfSource);
          pdfData = uint8Copy.buffer.slice(0);
        } else if (pdfSource instanceof Uint8Array) {
          const uint8Copy = new Uint8Array(pdfSource);
          pdfData = uint8Copy.buffer.slice(0);
        } else if (typeof pdfSource === 'string') {
          pdfData = pdfSource;
        } else {
          pdfData = pdfSource;
        }

        const loadingTask = pdfjsLib.getDocument({ data: pdfData });
        const pdf = await loadingTask.promise;

        if (!isMounted) return;

        setPdfDoc(pdf);
        setTotalPages(pdf.numPages);
        setLoading(false);
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load PDF');
          setLoading(false);
        }
      }
    }

    loadPDF();

    return () => {
      isMounted = false;
    };
  }, [pdfSource]);

  useEffect(() => {
    if (!pdfDoc || currentPage < 1 || currentPage > totalPages) return;

    let isMounted = true;

    async function renderCurrentPage() {
      if (!pdfDoc) return;

      try {
        const page = await pdfDoc.getPage(currentPage);

        await new Promise((resolve) => setTimeout(resolve, 80));
        const container = containerRef.current;
        if (!container) {
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
        const containerWidth = container?.clientWidth || window.innerWidth - 100;
        const viewport = page.getViewport({ scale: 1.0 });

        const pdfPageWidth = viewport.width;
        const pdfPageHeight = viewport.height;

        const widthScale = Math.max((containerWidth - 40) / viewport.width, 0.1);
        const finalScale = Math.max(Math.min(widthScale, 1.5), 0.6);

        setScale(finalScale);
        const scaledViewport = page.getViewport({ scale: finalScale });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        if (!context) {
          throw new Error('Failed to get canvas context');
        }

        const outputScale = window.devicePixelRatio || 1;
        canvas.width = Math.floor(scaledViewport.width * outputScale);
        canvas.height = Math.floor(scaledViewport.height * outputScale);
        canvas.style.width = `${scaledViewport.width}px`;
        canvas.style.height = `${scaledViewport.height}px`;
        context.setTransform(outputScale, 0, 0, outputScale, 0, 0);

        const renderViewport = page.getViewport({ scale: finalScale });
        const renderContext = {
          canvasContext: context,
          viewport: renderViewport,
          canvas: canvas,
        };

        await page.render(renderContext).promise;

        if (!isMounted) return;

        setCurrentPageCanvas(canvas);
        setRenderMetrics({
          viewportWidth: scaledViewport.width,
          viewportHeight: scaledViewport.height,
          outputScale,
          pdfPageWidth,
          pdfPageHeight,
        });
        setLoading(false);
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to render page');
        }
      }
    }

    renderCurrentPage();

    return () => {
      isMounted = false;
    };
  }, [pdfDoc, currentPage, totalPages, renderKey, containerRef]);

  useEffect(() => {
    if (!pdfDoc) return;

    const handleResize = () => {
      setCurrentPageCanvas(null);
      incrementRenderKey();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [pdfDoc]);

  return {
    pdfDoc,
    currentPageCanvas,
    renderMetrics,
    loading,
    error,
    totalPages,
    scale,
    renderKey,
    incrementRenderKey,
  };
}

