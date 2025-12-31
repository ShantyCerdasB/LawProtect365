/**
 * @fileoverview PdfXrefUpdater Tests - Unit tests for PDF cross-reference table updates
 * @summary Tests for PDF xref table updater
 * @description Tests the PdfXrefUpdater service that updates PDF cross-reference tables
 * when embedding signatures.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { PdfXrefUpdater } from '../../../../src/services/pdfService/PdfXrefUpdater';
import { PdfStructureParser } from '../../../../src/services/pdfService/PdfStructureParser';
import { createTestPdf, createMinimalPdfStructure } from '../../../helpers/pdfTestHelpers';
import type { NewPdfObject } from '../../../../src/domain/types/pdf';

describe('PdfXrefUpdater', () => {
  let updater: PdfXrefUpdater;
  let parser: PdfStructureParser;

  beforeEach(() => {
    updater = new PdfXrefUpdater();
    parser = new PdfStructureParser();
  });

  describe('createIncrementalUpdate', () => {
    it('should create incremental update with new objects', () => {
      const pdfContent = Buffer.from(createMinimalPdfStructure());
      const pdfStructure = parser.parseStructure(pdfContent);

      const newObjects: NewPdfObject[] = [
        {
          id: 10,
          generation: 0,
          content: '10 0 obj\n<<\n/Type /Test\n>>\nendobj\n',
          offset: 0,
        },
      ];

      const result = updater.createIncrementalUpdate(pdfContent, pdfStructure, newObjects);

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(pdfContent.length);
      expect(result.toString('latin1')).toContain('xref');
      expect(result.toString('latin1')).toContain('trailer');
      expect(result.toString('latin1')).toContain('startxref');
      expect(result.toString('latin1')).toContain('%%EOF');
    });

    it('should preserve original PDF content', () => {
      const pdfContent = Buffer.from(createMinimalPdfStructure());
      const pdfStructure = parser.parseStructure(pdfContent);
      const originalContent = pdfContent.toString('latin1');

      const newObjects: NewPdfObject[] = [
        {
          id: 10,
          generation: 0,
          content: '10 0 obj\n<<\n/Type /Test\n>>\nendobj\n',
          offset: 0,
        },
      ];

      const result = updater.createIncrementalUpdate(pdfContent, pdfStructure, newObjects);
      const resultString = result.toString('latin1');

      expect(resultString).toContain(originalContent.substring(0, pdfStructure.body.end));
    });

    it('should add multiple new objects', () => {
      const pdfContent = Buffer.from(createMinimalPdfStructure());
      const pdfStructure = parser.parseStructure(pdfContent);

      const newObjects: NewPdfObject[] = [
        {
          id: 10,
          generation: 0,
          content: '10 0 obj\n<<\n/Type /Test1\n>>\nendobj\n',
          offset: 0,
        },
        {
          id: 11,
          generation: 0,
          content: '11 0 obj\n<<\n/Type /Test2\n>>\nendobj\n',
          offset: 0,
        },
      ];

      const result = updater.createIncrementalUpdate(pdfContent, pdfStructure, newObjects);
      const resultString = result.toString('latin1');

      expect(resultString).toContain('10 0 obj');
      expect(resultString).toContain('11 0 obj');
    });

    it('should include Prev reference in trailer for incremental updates', () => {
      const pdfContent = Buffer.from(createMinimalPdfStructure());
      const pdfStructure = parser.parseStructure(pdfContent);

      const newObjects: NewPdfObject[] = [
        {
          id: 10,
          generation: 0,
          content: '10 0 obj\n<<\n/Type /Test\n>>\nendobj\n',
          offset: 0,
        },
      ];

      const result = updater.createIncrementalUpdate(pdfContent, pdfStructure, newObjects);
      const resultString = result.toString('latin1');

      expect(resultString).toContain('/Prev');
    });

    it('should preserve Root reference from previous trailer', () => {
      const pdfContent = Buffer.from(createMinimalPdfStructure());
      const pdfStructure = parser.parseStructure(pdfContent);
      const originalRoot = pdfStructure.xref.trailer.Root;

      const newObjects: NewPdfObject[] = [
        {
          id: 10,
          generation: 0,
          content: '10 0 obj\n<<\n/Type /Test\n>>\nendobj\n',
          offset: 0,
        },
      ];

      const result = updater.createIncrementalUpdate(pdfContent, pdfStructure, newObjects);
      const resultString = result.toString('latin1');

      if (originalRoot) {
        expect(resultString).toContain(`/Root ${originalRoot}`);
      }
    });
  });

  describe('getNextObjectNumber', () => {
    it('should return next available object number', () => {
      const pdfContent = Buffer.from(createMinimalPdfStructure());
      const pdfStructure = parser.parseStructure(pdfContent);

      const nextNumber = updater.getNextObjectNumber(pdfStructure);

      expect(nextNumber).toBeGreaterThan(0);
      expect(typeof nextNumber).toBe('number');
    });

    it('should return maxId + 1', () => {
      const pdfContent = Buffer.from(createMinimalPdfStructure());
      const pdfStructure = parser.parseStructure(pdfContent);
      const maxId = Math.max(...pdfStructure.xref.entries.map((e: any) => e.id), 0);

      const nextNumber = updater.getNextObjectNumber(pdfStructure);

      expect(nextNumber).toBe(maxId + 1);
    });

    it('should return 1 for empty xref entries', () => {
      const pdfStructure = {
        header: { version: '1.7', offset: 0 },
        body: { start: 0, end: 100 },
        xref: {
          offset: 100,
          entries: [],
          trailer: { Size: 0, Root: '' },
        },
        trailer: { offset: 100, content: '' },
      };

      const nextNumber = updater.getNextObjectNumber(pdfStructure);

      expect(nextNumber).toBe(1);
    });
  });
});

