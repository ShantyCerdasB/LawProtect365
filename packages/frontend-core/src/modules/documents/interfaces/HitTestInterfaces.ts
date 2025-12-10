/**
 * @fileoverview Hit Test Interfaces - Types for element hit-testing
 * @summary Type definitions for element bounding boxes and hit-testing
 * @description
 * Defines interfaces used by element hit-testing helpers for calculating
 * bounding boxes and testing point intersections. These interfaces are
 * platform-agnostic and reusable across web and mobile.
 */

import type { SignaturePlacement, TextPlacement, DatePlacement } from '../types';
import type { PdfElementType } from '../enums';

/**
 * @description Bounding box dimensions for an element.
 */
export interface ElementBounds {
  /** Width of the element in PDF points */
  width: number;
  /** Height of the element in PDF points */
  height: number;
  /** X coordinate of the element */
  x: number;
  /** Y coordinate of the element */
  y: number;
}

/**
 * @description Element configuration for hit-testing.
 */
export interface ElementHitTestConfig {
  /** Type of element */
  type: PdfElementType;
  /** Array of elements to test */
  elements: (SignaturePlacement | TextPlacement | DatePlacement)[];
}

