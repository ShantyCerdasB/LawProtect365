/**
 * @fileoverview PdfStructureParser Tests - Unit tests for PDF structure parsing
 * @summary Tests for low-level PDF structure parser
 * @description Tests the PdfStructureParser service that parses PDF internal structure
 * for digital signature embedding.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { PdfStructureParser } from '../../../../src/services/pdfService/PdfStructureParser';
import { createTestPdf, createMinimalPdfStructure } from '../../../helpers/pdfTestHelpers';
import {
  pdfInvalidStructure,
  pdfCorrupted,
} from '../../../../src/signature-errors';

describe('PdfStructureParser', () => {
  let parser: PdfStructureParser;

  beforeEach(() => {
    parser = new PdfStructureParser();
  });

  describe('parseStructure', () => {
    it('should parse valid PDF structure', async () => {
      const pdfContent = await createTestPdf();
      const structure = parser.parseStructure(pdfContent);

      expect(structure.header).toBeDefined();
      expect(structure.header.version).toMatch(/^\d\.\d$/);
      expect(structure.header.offset).toBe(0);
      expect(structure.body).toBeDefined();
      expect(structure.xref).toBeDefined();
      expect(structure.trailer).toBeDefined();
    });

    it('should parse minimal PDF structure', () => {
      const pdfContent = Buffer.from(createMinimalPdfStructure());
      const structure = parser.parseStructure(pdfContent);

      expect(structure.header.version).toBe('1.7');
      expect(structure.xref.entries.length).toBeGreaterThan(0);
      expect(structure.xref.trailer.Size).toBeGreaterThan(0);
    });

    it('should throw error for PDF without header', () => {
      const invalidPdf = Buffer.from('invalid pdf content');

      expect(() => parser.parseStructure(invalidPdf)).toThrow(
        pdfInvalidStructure('PDF header is missing or invalid')
      );
    });

    it('should throw error for PDF without xref table', () => {
      const pdfWithoutXref = Buffer.from('%PDF-1.7\n%%EOF');

      expect(() => parser.parseStructure(pdfWithoutXref)).toThrow(
        pdfInvalidStructure('PDF cross-reference table is missing')
      );
    });

    it('should find last xref offset for PDFs with incremental updates', () => {
      const pdfWithMultipleXref = Buffer.from(
        '%PDF-1.7\nxref\n0 0\nxref\n0 0\ntrailer\n<<\n/Size 1\n>>\nstartxref\n100\n%%EOF'
      );

      const structure = parser.parseStructure(pdfWithMultipleXref);

      expect(structure.xref.offset).toBeGreaterThan(0);
    });

    it('should parse xref entries correctly', () => {
      const pdfContent = Buffer.from(createMinimalPdfStructure());
      const structure = parser.parseStructure(pdfContent);

      expect(structure.xref.entries.length).toBeGreaterThan(0);
      structure.xref.entries.forEach((entry: any) => {
        expect(entry.id).toBeGreaterThanOrEqual(0);
        expect(entry.generation).toBeGreaterThanOrEqual(0);
        expect(entry.offset).toBeGreaterThanOrEqual(0);
        expect(typeof entry.inUse).toBe('boolean');
      });
    });

    it('should parse trailer dictionary correctly', () => {
      const pdfContent = Buffer.from(createMinimalPdfStructure());
      const structure = parser.parseStructure(pdfContent);

      expect(structure.xref.trailer.Size).toBeGreaterThan(0);
      expect(structure.xref.trailer.Root).toBeDefined();
    });

    it('should handle trailer with Prev reference', () => {
      const pdfWithPrev = Buffer.from(
        '%PDF-1.7\nxref\n0 0\ntrailer\n<<\n/Size 5\n/Root 1 0 R\n/Prev 100\n>>\nstartxref\n200\n%%EOF'
      );

      const structure = parser.parseStructure(pdfWithPrev);

      expect(structure.xref.trailer.Prev).toBe(100);
    });

    it('should throw error for corrupted xref table', () => {
      const corruptedPdf = Buffer.from(
        '%PDF-1.7\nxref invalid\ntrailer\n<<\n/Size 1\n>>\nstartxref\n100\n%%EOF'
      );

      expect(() => parser.parseStructure(corruptedPdf)).toThrow(
        pdfCorrupted('Cannot parse cross-reference table')
      );
    });

    it('should throw error for missing trailer', () => {
      const pdfWithoutTrailer = Buffer.from(
        '%PDF-1.7\nxref\n0 0\nstartxref\n100\n%%EOF'
      );

      expect(() => parser.parseStructure(pdfWithoutTrailer)).toThrow(
        pdfCorrupted('Cannot parse PDF trailer')
      );
    });

    it('should calculate body end correctly', () => {
      const pdfContent = Buffer.from(createMinimalPdfStructure());
      const structure = parser.parseStructure(pdfContent);

      expect(structure.body.end).toBe(structure.xref.offset);
    });
  });
});

