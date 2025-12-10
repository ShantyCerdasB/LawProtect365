/**
 * @fileoverview Use PDF Element Overlay - Hook for drawing element overlays on PDF canvas
 * @summary React hook for managing element overlay rendering (signatures, texts, dates)
 * @description
 * Manages the drawing of interactive element overlays (signatures, texts, dates) on top of
 * the PDF canvas. Handles image caching, resize handles, delete buttons, and pending element
 * previews. This is a web-specific hook that uses HTML canvas.
 * 
 * The hook is organized into private methods for each element type to reduce cognitive complexity
 * and improve maintainability. Common drawing operations are delegated to helper functions.
 */

import { useEffect, useRef, useCallback } from 'react';
import { PdfElementType, formatDate, DEFAULT_DATE_FORMAT } from '@lawprotect/frontend-core';
import type { UsePdfElementOverlayConfig } from '../interfaces';
import type { PdfPageRenderMetrics } from '../interfaces/PdfPageRendererInterfaces';
import {
  DEFAULT_DIMENSIONS,
  DEFAULT_FONT_SIZE,
  DEFAULT_FONT_FAMILY,
  REDRAW_TIMEOUT_MS,
  OVERLAY_COLORS,
  CONTROL_SIZES,
} from './constants/OverlayConstants';
import {
  drawResizeHandle,
  drawTextLikeResizeHandles,
  drawDeleteButton,
  drawElementStroke,
  drawPendingFill,
  drawClickIndicator,
} from './helpers/canvasHelpers';

/**
 * @description Hook for managing PDF element overlay rendering.
 * @param config Configuration for overlay rendering
 */
export function usePdfElementOverlay(config: UsePdfElementOverlayConfig): void {
  const {
    currentPageCanvas,
    displayCanvasRef,
    renderMetrics,
    currentPage,
    signatures,
    texts,
    dates,
    pendingCoordinates,
    pendingElementType,
    pendingSignatureImage,
    pendingSignatureWidth,
    pendingSignatureHeight,
    pendingText,
    pendingTextFontSize,
    pendingDate,
    pendingDateFormat,
    pendingDateFontSize,
    draggedElement,
    resizeHandle,
    onElementDelete,
    onSignatureResize,
    renderKey,
  } = config;

  const imageCacheRef = useRef(new Map<string, Promise<HTMLImageElement>>());

  /**
   * @description Loads an image and caches it for reuse.
   * @param src Image source URL or data URL
   * @returns Promise that resolves to the loaded image
   */
  const loadImageCached = useCallback((src: string): Promise<HTMLImageElement> => {
    const cache = imageCacheRef.current;
    const existing = cache.get(src);
    if (existing) return existing;

    const p = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
      img.src = src;
    });

    cache.set(src, p);
    return p;
  }, []);

  /**
   * @description Draws a signature element on the canvas.
   * @param ctx Canvas rendering context
   * @param sig Signature placement data
   * @param originalIndex Original index of signature in array
   * @param scaleX Horizontal scale factor
   * @param scaleY Vertical scale factor
   * @param renderMetrics Render metrics for output scale
   */
  const drawSignature = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      sig: { signatureImage: string; width?: number; height?: number; coordinates: { x: number; y: number } },
      originalIndex: number,
      scaleX: number,
      scaleY: number,
      renderMetrics: PdfPageRenderMetrics
    ): Promise<void> => {
      return loadImageCached(sig.signatureImage)
        .then((img) => {
          const width = (sig.width || DEFAULT_DIMENSIONS.SIGNATURE_WIDTH) * scaleX;
          const height = (sig.height || DEFAULT_DIMENSIONS.SIGNATURE_HEIGHT) * scaleY;
          const x = sig.coordinates.x * scaleX;
          const y = sig.coordinates.y * scaleY;

          const isActive =
            (draggedElement?.type === PdfElementType.Signature && draggedElement.index === originalIndex) ||
            (resizeHandle?.type === PdfElementType.Signature && resizeHandle.index === originalIndex);

          drawElementStroke(ctx, x, y, width, height, isActive, renderMetrics);
          ctx.drawImage(img, x, y, width, height);

          drawResizeHandle(ctx, x + width - CONTROL_SIZES.HANDLE_SIZE, y + height - CONTROL_SIZES.HANDLE_SIZE, renderMetrics);

          if (onElementDelete) {
            const deleteX = x + width - CONTROL_SIZES.DELETE_SIZE;
            const deleteY = y - CONTROL_SIZES.DELETE_SIZE;
            drawDeleteButton(ctx, deleteX, deleteY, renderMetrics);
          }
        })
        .catch((err) => {
          console.warn('Failed to load signature image:', err);
        });
    },
    [draggedElement, resizeHandle, onElementDelete, loadImageCached]
  );

  /**
   * @description Draws a text element on the canvas.
   * @param ctx Canvas rendering context
   * @param text Text placement data
   * @param originalIndex Original index of text in array
   * @param scaleX Horizontal scale factor
   * @param scaleY Vertical scale factor
   * @param renderMetrics Render metrics for output scale
   */
  const drawText = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      text: { text: string; fontSize?: number; color?: { r: number; g: number; b: number }; coordinates: { x: number; y: number } },
      originalIndex: number,
      scaleX: number,
      scaleY: number,
      renderMetrics: PdfPageRenderMetrics
    ): void => {
      const fontSize = (text.fontSize || DEFAULT_FONT_SIZE) * scaleY;
      const x = text.coordinates.x * scaleX;
      const y = text.coordinates.y * scaleY;

      ctx.font = `${fontSize}px ${DEFAULT_FONT_FAMILY}`;
      ctx.fillStyle = text.color ? `rgb(${text.color.r}, ${text.color.g}, ${text.color.b})` : OVERLAY_COLORS.BLACK;
      ctx.fillText(text.text, x, y);

      const metrics = ctx.measureText(text.text);
      const isActive =
        (draggedElement?.type === PdfElementType.Text && draggedElement.index === originalIndex) ||
        (resizeHandle?.type === PdfElementType.Text && resizeHandle.index === originalIndex);

      drawElementStroke(ctx, x, y - fontSize, metrics.width, fontSize, isActive, renderMetrics);
      drawTextLikeResizeHandles(ctx, x, y, metrics.width, fontSize, renderMetrics);

      if (onElementDelete) {
        const deleteX = x + metrics.width - CONTROL_SIZES.DELETE_SIZE;
        const deleteY = y - fontSize - CONTROL_SIZES.DELETE_SIZE;
        drawDeleteButton(ctx, deleteX, deleteY, renderMetrics);
      }
    },
    [draggedElement, resizeHandle, onElementDelete]
  );

  /**
   * @description Draws a date element on the canvas.
   * @param ctx Canvas rendering context
   * @param date Date placement data
   * @param originalIndex Original index of date in array
   * @param scaleX Horizontal scale factor
   * @param scaleY Vertical scale factor
   * @param renderMetrics Render metrics for output scale
   */
  const drawDate = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      date: { date: Date; format?: string; fontSize?: number; color?: { r: number; g: number; b: number }; coordinates: { x: number; y: number } },
      originalIndex: number,
      scaleX: number,
      scaleY: number,
      renderMetrics: PdfPageRenderMetrics
    ): void => {
      const format = date.format || DEFAULT_DATE_FORMAT;
      const formattedDate = formatDate(date.date, format);

      const fontSize = (date.fontSize || DEFAULT_FONT_SIZE) * scaleY;
      const x = date.coordinates.x * scaleX;
      const y = date.coordinates.y * scaleY;

      ctx.font = `${fontSize}px ${DEFAULT_FONT_FAMILY}`;
      ctx.fillStyle = date.color ? `rgb(${date.color.r}, ${date.color.g}, ${date.color.b})` : OVERLAY_COLORS.BLACK;
      ctx.fillText(formattedDate, x, y);

      const metrics = ctx.measureText(formattedDate);
      const isActive =
        (draggedElement?.type === PdfElementType.Date && draggedElement.index === originalIndex) ||
        (resizeHandle?.type === PdfElementType.Date && resizeHandle.index === originalIndex);

      drawElementStroke(ctx, x, y - fontSize, metrics.width, fontSize, isActive, renderMetrics);
      drawTextLikeResizeHandles(ctx, x, y, metrics.width, fontSize, renderMetrics);

      if (onElementDelete) {
        const deleteX = x + metrics.width - CONTROL_SIZES.DELETE_SIZE;
        const deleteY = y - fontSize - CONTROL_SIZES.DELETE_SIZE;
        drawDeleteButton(ctx, deleteX, deleteY, renderMetrics);
      }
    },
    [draggedElement, resizeHandle, onElementDelete]
  );

  /**
   * @description Draws pending signature element preview.
   * @param ctx Canvas rendering context
   * @param x X coordinate in display space
   * @param y Y coordinate in display space
   * @param scaleX Horizontal scale factor
   * @param scaleY Vertical scale factor
   * @param renderMetrics Render metrics for output scale
   */
  const drawPendingSignature = useCallback(
    async (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      scaleX: number,
      scaleY: number,
      renderMetrics: PdfPageRenderMetrics
    ): Promise<void> => {
      if (pendingSignatureImage) {
        try {
          const img = await loadImageCached(pendingSignatureImage);
          const width = pendingSignatureWidth;
          const height = pendingSignatureHeight;

          ctx.drawImage(img, x, y, width, height);
          drawElementStroke(ctx, x, y, width, height, true, renderMetrics);
          drawPendingFill(ctx, x, y, width, height);

          if (onSignatureResize) {
            drawResizeHandle(ctx, x + width - CONTROL_SIZES.HANDLE_SIZE, y + height - CONTROL_SIZES.HANDLE_SIZE, renderMetrics);
          }
        } catch (err) {
          console.error('[PDFViewer] Failed to load signature image:', err);
          const width = pendingSignatureWidth * scaleX;
          const height = pendingSignatureHeight * scaleY;
          drawElementStroke(ctx, x, y, width, height, true, renderMetrics);
          drawPendingFill(ctx, x, y, width, height);
        }
      } else {
        const width = pendingSignatureWidth * scaleX;
        const height = pendingSignatureHeight * scaleY;
        drawElementStroke(ctx, x, y, width, height, true, renderMetrics);
        drawPendingFill(ctx, x, y, width, height);
      }
    },
    [pendingSignatureImage, pendingSignatureWidth, pendingSignatureHeight, onSignatureResize, loadImageCached]
  );

  /**
   * @description Draws pending text element preview.
   * @param ctx Canvas rendering context
   * @param x X coordinate in display space
   * @param y Y coordinate in display space
   * @param scaleX Horizontal scale factor
   * @param scaleY Vertical scale factor
   * @param renderMetrics Render metrics for output scale
   */
  const drawPendingText = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      scaleX: number,
      scaleY: number,
      renderMetrics: PdfPageRenderMetrics
    ): void => {
      if (pendingText) {
        const fontSize = pendingTextFontSize * scaleY;
        ctx.font = `${fontSize}px ${DEFAULT_FONT_FAMILY}`;
        ctx.fillStyle = OVERLAY_COLORS.BLACK;
        ctx.fillText(pendingText, x, y);
        const metrics = ctx.measureText(pendingText);
        drawElementStroke(ctx, x, y - fontSize, metrics.width, fontSize, true, renderMetrics);
        drawPendingFill(ctx, x, y - fontSize, metrics.width, fontSize);
      } else {
        const placeholderWidth = DEFAULT_DIMENSIONS.TEXT_PLACEHOLDER_WIDTH * scaleX;
        const placeholderHeight = DEFAULT_DIMENSIONS.TEXT_PLACEHOLDER_HEIGHT * scaleY;
        drawElementStroke(ctx, x, y - placeholderHeight, placeholderWidth, placeholderHeight, true, renderMetrics);
        drawPendingFill(ctx, x, y - placeholderHeight, placeholderWidth, placeholderHeight);
      }
    },
    [pendingText, pendingTextFontSize]
  );

  /**
   * @description Draws pending date element preview.
   * @param ctx Canvas rendering context
   * @param x X coordinate in display space
   * @param y Y coordinate in display space
   * @param scaleX Horizontal scale factor
   * @param scaleY Vertical scale factor
   * @param renderMetrics Render metrics for output scale
   */
  const drawPendingDate = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      scaleX: number,
      scaleY: number,
      renderMetrics: PdfPageRenderMetrics
    ): void => {
      if (pendingDate) {
        const format = pendingDateFormat || DEFAULT_DATE_FORMAT;
        const formattedDate = formatDate(pendingDate, format);

        const fontSize = pendingDateFontSize * scaleY;
        ctx.font = `${fontSize}px ${DEFAULT_FONT_FAMILY}`;
        ctx.fillStyle = OVERLAY_COLORS.BLACK;
        ctx.fillText(formattedDate, x, y);
        const metrics = ctx.measureText(formattedDate);
        drawElementStroke(ctx, x, y - fontSize, metrics.width, fontSize, true, renderMetrics);
        drawPendingFill(ctx, x, y - fontSize, metrics.width, fontSize);
      } else {
        const placeholderWidth = DEFAULT_DIMENSIONS.DATE_PLACEHOLDER_WIDTH * scaleX;
        const placeholderHeight = DEFAULT_DIMENSIONS.DATE_PLACEHOLDER_HEIGHT * scaleY;
        drawElementStroke(ctx, x, y - placeholderHeight, placeholderWidth, placeholderHeight, true, renderMetrics);
        drawPendingFill(ctx, x, y - placeholderHeight, placeholderWidth, placeholderHeight);
      }
    },
    [pendingDate, pendingDateFormat, pendingDateFontSize]
  );

  /**
   * @description Draws all element previews on the canvas.
   * @param ctx Canvas rendering context
   * @param canvas Canvas element
   * @param pageNumber Page number to draw elements for
   */
  const drawElementPreviews = useCallback(
    async (
      ctx: CanvasRenderingContext2D,
      canvas: HTMLCanvasElement,
      pageNumber: number
    ): Promise<void> => {
      if (!currentPageCanvas || !renderMetrics) return;

      const pdfPageWidth = renderMetrics.pdfPageWidth;
      const pdfPageHeight = renderMetrics.pdfPageHeight;
      const displayWidth = renderMetrics.viewportWidth;
      const displayHeight = renderMetrics.viewportHeight;
      const scaleX = displayWidth / pdfPageWidth;
      const scaleY = displayHeight / pdfPageHeight;

      const signaturePromises = signatures
        .map((sig, originalIndex) => ({ sig, originalIndex }))
        .filter(({ sig }) => sig.coordinates.pageNumber === pageNumber)
        .map(({ sig, originalIndex }) => drawSignature(ctx, sig, originalIndex, scaleX, scaleY, renderMetrics));

      await Promise.all(signaturePromises);

      texts
        .map((text, originalIndex) => ({ text, originalIndex }))
        .filter(({ text }) => text.coordinates.pageNumber === pageNumber)
        .forEach(({ text, originalIndex }) => drawText(ctx, text, originalIndex, scaleX, scaleY, renderMetrics));

      dates
        .map((date, originalIndex) => ({ date, originalIndex }))
        .filter(({ date }) => date.coordinates.pageNumber === pageNumber)
        .forEach(({ date, originalIndex }) => drawDate(ctx, date, originalIndex, scaleX, scaleY, renderMetrics));

      if (pendingCoordinates && pendingCoordinates.pageNumber === pageNumber && pendingElementType) {
        const x = pendingCoordinates.x * scaleX;
        const y = pendingCoordinates.y * scaleY;

        if (pendingElementType === PdfElementType.Signature) {
          await drawPendingSignature(ctx, x, y, scaleX, scaleY, renderMetrics);
        } else if (pendingElementType === PdfElementType.Text) {
          drawPendingText(ctx, x, y, scaleX, scaleY, renderMetrics);
        } else if (pendingElementType === PdfElementType.Date) {
          drawPendingDate(ctx, x, y, scaleX, scaleY, renderMetrics);
        }

        drawClickIndicator(ctx, x, y);
      }
    },
    [
      currentPageCanvas,
      renderMetrics,
      signatures,
      texts,
      dates,
      pendingCoordinates,
      pendingElementType,
      draggedElement,
      resizeHandle,
      onElementDelete,
      onSignatureResize,
      drawSignature,
      drawText,
      drawDate,
      drawPendingSignature,
      drawPendingText,
      drawPendingDate,
    ]
  );

  useEffect(() => {
    if (!currentPageCanvas || !displayCanvasRef.current) return;

    const redrawPreviews = async () => {
      const displayCanvas = displayCanvasRef.current;
      if (!displayCanvas || !currentPageCanvas || !renderMetrics) return;

      const ctx = displayCanvas.getContext('2d');
      if (!ctx) return;

      const displayWidth = renderMetrics.viewportWidth;
      const displayHeight = renderMetrics.viewportHeight;
      const outputScale = renderMetrics.outputScale;

      displayCanvas.width = currentPageCanvas.width;
      displayCanvas.height = currentPageCanvas.height;
      displayCanvas.style.width = `${displayWidth}px`;
      displayCanvas.style.height = `${displayHeight}px`;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, displayCanvas.width, displayCanvas.height);
      ctx.setTransform(outputScale, 0, 0, outputScale, 0, 0);
      ctx.drawImage(currentPageCanvas, 0, 0, displayWidth, displayHeight);

      await drawElementPreviews(ctx, displayCanvas, currentPage);
    };

    const timeoutId = setTimeout(() => {
      redrawPreviews();
    }, REDRAW_TIMEOUT_MS);

    return () => clearTimeout(timeoutId);
  }, [
    currentPageCanvas,
    currentPage,
    renderMetrics,
    renderKey,
    drawElementPreviews,
    displayCanvasRef,
  ]);
}
