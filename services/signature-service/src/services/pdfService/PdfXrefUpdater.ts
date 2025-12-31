/**
 * @fileoverview PdfXrefUpdater - Updates PDF cross-reference tables
 * @summary Manages cross-reference table updates for signature embedding
 * @description
 * Updates PDF cross-reference tables when embedding signatures. Supports incremental
 * updates to add new objects without modifying existing content, enabling multiple signatures.
 */

import type { PdfStructure, PdfObjectRef, NewPdfObject } from '@/domain/types/pdf';

/**
 * @description
 * Updates PDF cross-reference tables for signature embedding. Creates incremental updates
 * that preserve existing signatures by adding new objects and cross-reference entries.
 */
export class PdfXrefUpdater {
  /**
   * @description
   * Creates an incremental PDF update with new objects. Adds new objects to the PDF body,
   * creates a new cross-reference table, and updates the trailer while preserving the
   * previous xref for incremental update chain.
   * @param {Buffer} pdfContent - Current PDF content
   * @param {PdfStructure} pdfStructure - Parsed PDF structure
   * @param {NewPdfObject[]} newObjects - New PDF objects to add
   * @returns {Buffer} Updated PDF content with new cross-reference table
   */
  createIncrementalUpdate(
    pdfContent: Buffer,
    pdfStructure: PdfStructure,
    newObjects: NewPdfObject[]
  ): Buffer {
    let content = pdfContent.toString('latin1');
    const parts: string[] = [];
    
    if (!content.endsWith('\n')) {
      content += '\n';
    }
    parts.push(content);
    
    let currentOffset = Buffer.byteLength(content, 'latin1');
    const xrefEntries: PdfObjectRef[] = [];
    
    for (const obj of newObjects) {
      obj.offset = currentOffset;
      parts.push(obj.content);
      currentOffset += Buffer.byteLength(obj.content, 'latin1');
      
      xrefEntries.push({
        id: obj.id,
        generation: obj.generation,
        offset: obj.offset,
        inUse: true,
      });
    }
    
    const xrefOffset = currentOffset;
    const xrefContent = this.buildXrefTable(xrefEntries);
    parts.push(xrefContent);
    
    const maxNewId = xrefEntries.length > 0 ? Math.max(...xrefEntries.map((e) => e.id)) : 0;
    const previousSize = pdfStructure.xref.trailer.Size || 0;
    const newSize = Math.max(previousSize, maxNewId + 1);
    
    const trailerContent = this.buildTrailer(
      pdfStructure.xref.trailer,
      newSize,
      pdfStructure.xref.offset
    );
    parts.push(trailerContent);
    
    parts.push(`startxref\n${xrefOffset}\n%%EOF\n`);
    
    return Buffer.from(parts.join(''), 'latin1');
  }

  /**
   * @description
   * Builds a cross-reference table from object references. Formats entries according
   * to PDF specification with proper padding and handles gaps in object numbering.
   * @param {PdfObjectRef[]} entries - Cross-reference entries
   * @returns {string} Formatted cross-reference table content
   */
  private buildXrefTable(entries: PdfObjectRef[]): string {
    if (entries.length === 0) {
      return `xref\n0 0\n`;
    }
    
    const sortedEntries = [...entries].sort((a, b) => a.id - b.id);
    const minId = sortedEntries[0].id;
    const maxId = sortedEntries[sortedEntries.length - 1].id;
    const count = maxId - minId + 1;
    
    const lines: string[] = [];
    lines.push('xref');
    lines.push(`${minId} ${count}`);
    
    const entryMap = new Map<number, PdfObjectRef>();
    for (const entry of sortedEntries) {
      entryMap.set(entry.id, entry);
    }
    
    for (let i = minId; i <= maxId; i++) {
      const entry = entryMap.get(i);
      if (entry) {
        lines.push(
          `${entry.offset.toString().padStart(10, '0')} ${entry.generation.toString().padStart(5, '0')} n`
        );
      } else {
        lines.push(`0000000000 65535 f`);
      }
    }
    
    return lines.join('\n') + '\n';
  }

  /**
   * @description
   * Builds a PDF trailer dictionary. Preserves Root reference from previous trailer
   * and adds Prev reference for incremental update chain.
   * @param {PdfStructure['xref']['trailer']} previousTrailer - Previous trailer dictionary
   * @param {number} size - Total number of objects in PDF
   * @param {number} prevXrefOffset - Offset of previous cross-reference table
   * @returns {string} Formatted trailer content
   */
  private buildTrailer(
    previousTrailer: PdfStructure['xref']['trailer'],
    size: number,
    prevXrefOffset?: number
  ): string {
    const lines: string[] = [];
    lines.push('trailer');
    lines.push('<<');
    lines.push(`  /Size ${size}`);
    
    if (previousTrailer.Root) {
      lines.push(`  /Root ${previousTrailer.Root}`);
    }
    
    if (prevXrefOffset !== undefined) {
      lines.push(`  /Prev ${prevXrefOffset}`);
    }
    
    lines.push('>>');
    
    return lines.join('\n') + '\n';
  }

  /**
   * @description
   * Gets the next available PDF object number by finding the maximum object ID
   * in the cross-reference table and incrementing it.
   * @param {PdfStructure} pdfStructure - Parsed PDF structure
   * @returns {number} Next available object number
   */
  getNextObjectNumber(pdfStructure: PdfStructure): number {
    const maxId = Math.max(...pdfStructure.xref.entries.map((e: PdfObjectRef) => e.id), 0);
    return maxId + 1;
  }
}

