/**
 * @fileoverview Documents Module Barrel Tests - Ensures barrel re-exports work correctly
 * @summary Tests for modules/documents/index.ts barrel exports
 */

import * as DocumentsModule from '../../../src/modules/documents/index';
import type { PDFCoordinates, SignaturePlacement, PDFSource, UseDocumentSigningConfig, UseDocumentSigningResult } from '../../../src/modules/documents/index';

describe('modules/documents index (barrel) re-exports', () => {
  it('re-exports types (type-only imports work)', () => {
    // Types are available for import (compile-time check)
    const _testCoordinates: PDFCoordinates = {
      x: 0,
      y: 0,
      pageNumber: 1,
      pageWidth: 100,
      pageHeight: 100,
    };
    const _testPlacement: SignaturePlacement = {
      signatureImage: 'data:image/png;base64,test',
      coordinates: _testCoordinates,
    };
    const _testSource: PDFSource = new Uint8Array([1, 2, 3]);
    const _testConfig: UseDocumentSigningConfig = {
      pdfSource: _testSource,
    };
    const _testResult: UseDocumentSigningResult = {
      signatures: [],
      addSignature: () => {},
      removeSignature: () => {},
      clearSignatures: () => {},
      applySignatures: async () => '',
      isApplying: false,
      error: null,
    };
    expect(_testCoordinates).toBeDefined();
    expect(_testPlacement).toBeDefined();
    expect(_testSource).toBeDefined();
    expect(_testConfig).toBeDefined();
    expect(_testResult).toBeDefined();
  });

  it('re-exports use cases', () => {
    expect(typeof DocumentsModule.applySignatureToPdf).toBe('function');
  });

  it('re-exports query hooks', () => {
    expect(typeof DocumentsModule.useDocumentSigning).toBe('function');
  });

  it('smoke-tests exported functions', () => {
    // Verify applySignatureToPdf is callable
    expect(DocumentsModule.applySignatureToPdf).toBeDefined();
    expect(typeof DocumentsModule.applySignatureToPdf).toBe('function');

    // Verify useDocumentSigning is callable
    expect(DocumentsModule.useDocumentSigning).toBeDefined();
    expect(typeof DocumentsModule.useDocumentSigning).toBe('function');
  });
});

