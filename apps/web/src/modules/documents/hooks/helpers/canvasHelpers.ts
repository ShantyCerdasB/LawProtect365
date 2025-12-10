/**
 * @fileoverview Canvas Helpers - Helper functions for canvas drawing operations
 * @summary Utility functions for drawing common overlay elements on canvas
 * @description
 * Provides reusable helper functions for drawing common overlay elements like
 * resize handles, delete buttons, strokes, and fills. This eliminates code
 * duplication and makes the overlay rendering code more maintainable.
 */

import type { PdfPageRenderMetrics } from '../../interfaces';
import {
  CONTROL_SIZES,
  STROKE_CONFIG,
  OVERLAY_COLORS,
} from '../constants/OverlayConstants';

/**
 * @description Draws a resize handle at the specified position.
 * @param ctx Canvas rendering context
 * @param x X coordinate of handle position
 * @param y Y coordinate of handle position
 * @param renderMetrics Render metrics for output scale calculation
 */
export function drawResizeHandle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  renderMetrics: PdfPageRenderMetrics
): void {
  const handleSize = CONTROL_SIZES.HANDLE_SIZE;
  ctx.fillStyle = OVERLAY_COLORS.ACTIVE;
  ctx.strokeStyle = OVERLAY_COLORS.WHITE;
  ctx.lineWidth = STROKE_CONFIG.LINE_WIDTH_ACTIVE / (renderMetrics.outputScale || 1);
  ctx.fillRect(x, y, handleSize, handleSize);
  ctx.strokeRect(x, y, handleSize, handleSize);
}

/**
 * @description Draws all four resize handles for a text/date element.
 * @param ctx Canvas rendering context
 * @param x X coordinate of element top-left
 * @param y Y coordinate of element baseline
 * @param width Width of element
 * @param fontSize Font size of element
 * @param renderMetrics Render metrics for output scale calculation
 */
export function drawTextLikeResizeHandles(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  fontSize: number,
  renderMetrics: PdfPageRenderMetrics
): void {
  const handleSize = CONTROL_SIZES.HANDLE_SIZE;
  const padding = STROKE_CONFIG.PADDING;
  const topY = y - fontSize - padding;
  const bottomY = y - padding;

  // Top-left
  drawResizeHandle(ctx, x - padding, topY, renderMetrics);
  // Top-right
  drawResizeHandle(ctx, x + width - handleSize, topY, renderMetrics);
  // Bottom-left
  drawResizeHandle(ctx, x - padding, bottomY, renderMetrics);
  // Bottom-right
  drawResizeHandle(ctx, x + width - handleSize, bottomY, renderMetrics);
}

/**
 * @description Draws a delete button at the specified position.
 * @param ctx Canvas rendering context
 * @param x X coordinate of delete button position
 * @param y Y coordinate of delete button position
 * @param renderMetrics Render metrics for output scale calculation
 */
export function drawDeleteButton(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  renderMetrics: PdfPageRenderMetrics
): void {
  const deleteSize = CONTROL_SIZES.DELETE_SIZE;
  const offset = CONTROL_SIZES.DELETE_OFFSET_X;

  ctx.fillStyle = OVERLAY_COLORS.DELETE;
  ctx.strokeStyle = OVERLAY_COLORS.WHITE;
  ctx.lineWidth = STROKE_CONFIG.LINE_WIDTH_ACTIVE / (renderMetrics.outputScale || 1);
  ctx.fillRect(x, y, deleteSize, deleteSize);
  ctx.strokeRect(x, y, deleteSize, deleteSize);

  ctx.beginPath();
  ctx.moveTo(x + offset, y + offset);
  ctx.lineTo(x + deleteSize - offset, y + deleteSize - offset);
  ctx.moveTo(x + deleteSize - offset, y + offset);
  ctx.lineTo(x + offset, y + deleteSize - offset);
  ctx.stroke();
}

/**
 * @description Draws a stroke rectangle around an element.
 * @param ctx Canvas rendering context
 * @param x X coordinate of element
 * @param y Y coordinate of element
 * @param width Width of element
 * @param height Height of element
 * @param isActive Whether element is active (dragged/resized)
 * @param renderMetrics Render metrics for output scale calculation
 */
export function drawElementStroke(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  isActive: boolean,
  renderMetrics: PdfPageRenderMetrics
): void {
  const padding = STROKE_CONFIG.PADDING;
  ctx.strokeStyle = isActive ? OVERLAY_COLORS.ACTIVE : OVERLAY_COLORS.NORMAL;
  ctx.lineWidth = isActive
    ? STROKE_CONFIG.LINE_WIDTH_DRAGGED
    : STROKE_CONFIG.LINE_WIDTH_ACTIVE;
  ctx.lineWidth = ctx.lineWidth / (renderMetrics.outputScale || 1);
  ctx.setLineDash(isActive ? STROKE_CONFIG.DASH_PATTERN : []);
  ctx.strokeRect(x - padding, y - padding, width + padding * 2, height + padding * 2);
  ctx.setLineDash([]);
}

/**
 * @description Draws a fill rectangle for pending elements.
 * @param ctx Canvas rendering context
 * @param x X coordinate of element
 * @param y Y coordinate of element
 * @param width Width of element
 * @param height Height of element
 */
export function drawPendingFill(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  const padding = STROKE_CONFIG.PADDING;
  ctx.fillStyle = OVERLAY_COLORS.PENDING_FILL;
  ctx.fillRect(x - padding, y - padding, width + padding * 2, height + padding * 2);
}

/**
 * @description Draws a click indicator circle.
 * @param ctx Canvas rendering context
 * @param x X coordinate of click point
 * @param y Y coordinate of click point
 */
export function drawClickIndicator(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number
): void {
  ctx.fillStyle = OVERLAY_COLORS.RED;
  ctx.beginPath();
  ctx.arc(x, y, CONTROL_SIZES.CLICK_INDICATOR_RADIUS, 0, Math.PI * 2);
  ctx.fill();
}

