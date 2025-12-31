/**
 * @fileoverview PdfStructure - Types for PDF structure parsing
 * @summary Type definitions for PDF structure components
 * @description
 * This file contains type definitions for PDF structure parsing,
 * including object references, cross-reference tables, and overall structure.
 */

/**
 * PDF object reference
 */
export interface PdfObjectRef {
  id: number;
  generation: number;
  offset: number;
  inUse: boolean;
}

/**
 * PDF cross-reference table information
 */
export interface PdfXrefInfo {
  offset: number;
  entries: PdfObjectRef[];
  trailer: {
    Size: number;
    Root: string;
    Prev?: number;
    [key: string]: any;
  };
}

/**
 * PDF structure information
 */
export interface PdfStructure {
  header: {
    version: string;
    offset: number;
  };
  body: {
    start: number;
    end: number;
  };
  xref: PdfXrefInfo;
  trailer: {
    offset: number;
    content: string;
  };
}





