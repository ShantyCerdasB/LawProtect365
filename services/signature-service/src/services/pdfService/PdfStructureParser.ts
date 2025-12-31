/**
 * @fileoverview PdfStructureParser - Low-level PDF structure parser for signature embedding
 * @summary Parses PDF internal structure for digital signature embedding
 * @description
 * Parses low-level PDF structure (xref, trailer, object references) required for
 * embedding digital signatures. This parser is necessary because pdf-lib does not
 * expose low-level APIs for cross-reference tables, trailers, or byte-level manipulation
 * needed for cryptographic signature embedding.
 * 
 * Handles:
 * - PDF header and version detection
 * - Cross-reference table (xref) parsing
 * - Trailer dictionary parsing (Root, Prev, Size)
 * - Object reference extraction
 * - Support for incremental updates (multiple signatures)
 */

import type { PdfStructure, PdfXrefInfo, PdfObjectRef } from '@/domain/types/pdf';
import {
  pdfCorrupted,
  pdfInvalidStructure
} from '@/signature-errors';

/**
 * @description
 * Low-level PDF structure parser for digital signature embedding. Parses internal
 * PDF structure (xref, trailer) that pdf-lib cannot access. Required for embedding
 * cryptographic signatures which need byte-level control and cross-reference table updates.
 */
export class PdfStructureParser {
  /**
   * @description
   * Parses low-level PDF structure including header, cross-reference table, and trailer.
   * This information is required for embedding digital signatures as it provides access
   * to object numbers, byte offsets, and trailer metadata that pdf-lib does not expose.
   * @param {Buffer} pdfContent - PDF content buffer
   * @returns {PdfStructure} Parsed PDF structure with xref and trailer information
   * @throws {BadRequestError} when PDF structure is invalid or corrupted
   */
  parseStructure(pdfContent: Buffer): PdfStructure {
    const content = pdfContent.toString('latin1');
    
    const headerMatch = content.match(/^%PDF-(\d\.\d)/);
    if (!headerMatch) {
      throw pdfInvalidStructure('PDF header is missing or invalid');
    }
    
    const header = {
      version: headerMatch[1],
      offset: 0,
    };
    
    const xrefOffset = this.findXrefOffset(content);
    if (xrefOffset === -1) {
      throw pdfInvalidStructure('PDF cross-reference table is missing');
    }
    
    const xref = this.parseXref(content, xrefOffset);
    const bodyEnd = this.findBodyEnd(content, xrefOffset);
    
    return {
      header,
      body: {
        start: headerMatch[0].length,
        end: bodyEnd,
      },
      xref,
      trailer: {
        offset: xrefOffset,
        content: content.substring(xrefOffset),
      },
    };
  }

  /**
   * @description
   * Finds the offset of the last cross-reference table. For PDFs with incremental updates,
   * there may be multiple xref tables; we need the last one to support multiple signatures.
   * @param {string} content - PDF content as string
   * @returns {number} Offset of last xref or -1 if not found
   */
  private findLastXrefOffset(content: string): number {
    // Match standalone "xref" at start of file or start of a line.
    // Avoid matching the "xref" substring inside "startxref".
    const xrefMatches = [...content.matchAll(/(^|[\r\n])xref[\s\r\n]/g)];
    if (xrefMatches.length === 0) {
      return -1;
    }
    
    const lastMatch = xrefMatches[xrefMatches.length - 1];
    const prefix = lastMatch[1] ?? '';
    return (lastMatch.index ?? 0) + prefix.length;
  }

  /**
   * @description
   * Finds xref offset using the value after the last startxref keyword (preferred).
   * Falls back to regex search if the value is invalid or missing.
   * @param {string} content - PDF content as string
   * @returns {number} Offset of xref or -1 if not found
   */
  private findXrefOffset(content: string): number {
    const lower = content.toLowerCase();
    const startxrefPos = lower.lastIndexOf('startxref');
    if (startxrefPos !== -1) {
      const after = content.substring(startxrefPos + 'startxref'.length);
      const match = after.match(/(\d+)/);
      if (match) {
        const offset = parseInt(match[1], 10);
        if (
          !Number.isNaN(offset) &&
          offset >= 0 &&
          offset < content.length &&
          content.substring(offset, offset + 4) === 'xref'
        ) {
          return offset;
        }
      }
    }
    return this.findLastXrefOffset(content);
  }

  /**
   * @description
   * Parses cross-reference table to extract object references. The xref table maps
   * object numbers to their byte offsets in the PDF, which is essential for incremental
   * updates when embedding signatures.
   * @param {string} content - PDF content as string
   * @param {number} offset - Offset where xref starts
   * @returns {PdfXrefInfo} Parsed xref information with entries and trailer
   * @throws {BadRequestError} when PDF is corrupted
   */
  private parseXref(content: string, offset: number): PdfXrefInfo {
    const xrefSection = content.substring(offset);
    
    const xrefKeywordPos = xrefSection.indexOf('xref');
    if (xrefKeywordPos === -1) {
      throw pdfCorrupted('Cannot parse cross-reference table: xref keyword not found');
    }
    
    // Lenient search: case-insensitive positions for trailer/startxref
    let trailerPos = xrefSection.search(/trailer/i);
    let startxrefPos = xrefSection.search(/startxref/i);

    // Fallback: search in full content if not found in the section
    if (trailerPos === -1 || startxrefPos === -1) {
      const lowerContent = content.toLowerCase();
      const globalTrailer = lowerContent.lastIndexOf('trailer');
      const globalStartxref = lowerContent.lastIndexOf('startxref');

      if (trailerPos === -1 && globalTrailer !== -1 && globalTrailer >= offset) {
        trailerPos = globalTrailer - offset;
      }

      if (startxrefPos === -1 && globalStartxref !== -1 && globalStartxref >= offset) {
        startxrefPos = globalStartxref - offset;
      }
    }
    
    const endPos = this.determineXrefEndPosition(trailerPos, startxrefPos, xrefSection, content, offset);
    
    let xrefContent = this.extractXrefContent(xrefSection, xrefKeywordPos, endPos);
    // Trim xrefContent to exclude any following trailer/startxref noise
    const cutPos = (() => {
      const lower = xrefContent.toLowerCase();
      const tPos = lower.indexOf('trailer');
      const sPos = lower.indexOf('startxref');
      const candidates = [tPos, sPos].filter((v) => v !== -1);
      if (candidates.length === 0) return -1;
      return Math.min(...candidates);
    })();
    if (cutPos !== -1) {
      xrefContent = xrefContent.substring(0, cutPos);
    }

    const { startObj, count, entriesText } = this.parseXrefHeader(xrefContent);
    const entries = this.parseXrefEntries(entriesText, startObj, count);
    const trailer = this.parseTrailerFromSection(xrefSection);
    
    return {
      offset,
      entries,
      trailer,
    };
  }

  /**
   * @description
   * Determines end position of xref entries section.
   * @param {number} trailerPos - Position of trailer keyword
   * @param {number} startxrefPos - Position of startxref keyword
   * @param {string} xrefSection - Xref section for error context
   * @returns {number} End position of xref entries
   * @throws {BadRequestError} when neither keyword is found
   */
  private determineXrefEndPosition(
    trailerPos: number,
    startxrefPos: number,
    _xrefSection: string,
    content: string,
    offset: number
  ): number {
    if (trailerPos !== -1 && startxrefPos !== -1) {
      return Math.min(trailerPos, startxrefPos);
    }
    
    if (trailerPos !== -1) {
      return trailerPos;
    }
    
    if (startxrefPos !== -1) {
      return startxrefPos;
    }
    
    // Fallback: next startxref in full content after current offset
    const lower = content.toLowerCase();
    const nextStartxref = lower.indexOf('startxref', offset + 1);
    if (nextStartxref !== -1) {
      return nextStartxref - offset;
    }
    
    // Last resort: end of content relative to offset
    return content.length - offset;
  }

  /**
   * @description
   * Extracts xref entries content between xref keyword and trailer/startxref.
   * @param {string} xrefSection - Xref section content
   * @param {number} xrefKeywordPos - Position of xref keyword
   * @param {number} endPos - End position (trailer or startxref)
   * @returns {string} Xref entries content
   */
  private extractXrefContent(xrefSection: string, xrefKeywordPos: number, endPos: number): string {
    const xrefEndPos = xrefKeywordPos + 4;
    let contentStart = xrefEndPos;
    
    while (contentStart < xrefSection.length && /\s/.test(xrefSection[contentStart])) {
      contentStart++;
    }
    
    return xrefSection.substring(contentStart, endPos).trim();
  }

  /**
   * @description
   * Parses xref header to extract start object number and count.
   * @param {string} xrefContent - Xref entries content
   * @returns {object} Parsed header with startObj, count, and remaining entries text
   * @throws {BadRequestError} when header format is invalid
   */
  private parseXrefHeader(xrefContent: string): { startObj: number; count: number; entriesText: string } {
    const lines = xrefContent
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      throw pdfCorrupted('Cannot parse cross-reference table: no content after xref');
    }

    const headerIndex = lines.findIndex((line) => /^\d+\s+\d+$/.test(line));
    if (headerIndex === -1) {
      throw pdfCorrupted('Cannot parse cross-reference table: invalid format');
    }

    const headerParts = lines[headerIndex].split(/\s+/);
    const startObj = parseInt(headerParts[0], 10);
    const count = parseInt(headerParts[1], 10);

    if (Number.isNaN(startObj) || Number.isNaN(count)) {
      throw pdfCorrupted('Cannot parse cross-reference table: invalid numbers');
    }

    const entriesText = lines.slice(headerIndex + 1).join('\n');

    return { startObj, count, entriesText };
  }

  /**
   * @description
   * Parses trailer dictionary from xref section.
   * @param {string} xrefSection - Xref section content
   * @returns {PdfXrefInfo['trailer']} Parsed trailer dictionary
   * @throws {BadRequestError} when trailer cannot be parsed
   */
  private parseTrailerFromSection(xrefSection: string): PdfXrefInfo['trailer'] {
    const trailerStart = xrefSection.search(/trailer/i);
    if (trailerStart === -1) {
      throw pdfCorrupted('Cannot parse PDF trailer');
    }
    
    const trailerContent = xrefSection.substring(trailerStart + 'trailer'.length);
    const dictMatch = this.extractDictionary(trailerContent);
    if (!dictMatch) {
      throw pdfCorrupted('Cannot parse PDF trailer');
    }
    
    return this.parseTrailer(dictMatch);
  }

  /**
   * @description
   * Extracts a PDF dictionary from text by matching balanced angle brackets.
   * Handles nested dictionaries correctly.
   * @param {string} text - Text starting with dictionary
   * @returns {string | null} Dictionary content without outer brackets, or null if not found
   */
  private extractDictionary(text: string): string | null {
    const trimmed = text.trim();
    if (!trimmed.startsWith('<<')) {
      return null;
    }
    
    let depth = 0;
    let start = -1;
    let end = -1;
    
    for (let i = 0; i < trimmed.length; i++) {
      if (i < trimmed.length - 1 && trimmed[i] === '<' && trimmed[i + 1] === '<') {
        if (depth === 0) {
          start = i + 2;
        }
        depth++;
        i++;
      } else if (i < trimmed.length - 1 && trimmed[i] === '>' && trimmed[i + 1] === '>') {
        depth--;
        if (depth === 0) {
          end = i;
          break;
        }
        i++;
      }
    }
    
    if (start !== -1 && end !== -1) {
      return trimmed.substring(start, end).trim();
    }
    
    return null;
  }

  /**
   * @description
   * Parses individual cross-reference entries. Each entry maps an object number to its
   * byte offset and generation number in the PDF file.
   * @param {string} entriesText - Text containing xref entries
   * @param {number} startObj - Starting object number
   * @param {number} _count - Number of entries (unused)
   * @returns {PdfObjectRef[]} Array of parsed object references
   */
  private parseXrefEntries(entriesText: string, startObj: number, _count: number): PdfObjectRef[] {
    const entries: PdfObjectRef[] = [];
    const lines = entriesText.trim().split('\n');
    
    let objNum = startObj;
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      if (trimmed.toLowerCase().startsWith('trailer')) break;
      if (trimmed.toLowerCase().startsWith('startxref')) break;
      if (/^\d+\s+\d+$/.test(trimmed)) break; // header of another subsection
      
      const parts = trimmed.split(/\s+/);
      if (parts.length >= 3) {
        const offset = parseInt(parts[0], 10);
        const generation = parseInt(parts[1], 10);
        const inUse = parts[2] === 'n';
        
        entries.push({
          id: objNum++,
          generation,
          offset,
          inUse,
        });
      }
    }
    
    return entries;
  }

  /**
   * @description
   * Parses PDF trailer dictionary to extract Root catalog reference, Size (object count),
   * and Prev (previous xref offset for incremental updates). This metadata is required
   * for creating valid incremental updates when embedding signatures.
   * @param {string} trailerText - Trailer dictionary text
   * @returns {PdfXrefInfo['trailer']} Parsed trailer object with Root, Size, and Prev
   */
  private parseTrailer(trailerText: string): PdfXrefInfo['trailer'] {
    const trailer: PdfXrefInfo['trailer'] = {
      Size: 0,
      Root: '',
    };
    
    const sizeMatch = trailerText.match(/\/Size\s+(\d+)/);
    if (sizeMatch) {
      trailer.Size = parseInt(sizeMatch[1], 10);
    }
    
    const rootMatch = trailerText.match(/\/Root\s+(\d+\s+\d+\s+R)/);
    if (rootMatch) {
      trailer.Root = rootMatch[1];
    }
    
    const prevMatch = trailerText.match(/\/Prev\s+(\d+)/);
    if (prevMatch) {
      trailer.Prev = parseInt(prevMatch[1], 10);
    }
    
    return trailer;
  }

  /**
   * @description
   * Finds the end of PDF body content, which is just before the first cross-reference table.
   * This boundary is needed to determine where new objects can be added during incremental updates.
   * @param {string} _content - PDF content as string (unused)
   * @param {number} xrefOffset - Offset of first xref
   * @returns {number} Offset where body ends
   */
  private findBodyEnd(_content: string, xrefOffset: number): number {
    return xrefOffset;
  }

}

