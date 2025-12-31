/**
 * @fileoverview PDF Test Helpers - Helper functions for PDF service tests
 * @summary Utilities for creating test PDFs and PDF-related test data
 * @description This module provides helper functions for creating test PDFs,
 * mock certificate chains, and other PDF-related test utilities.
 */

import { PDFDocument } from 'pdf-lib';
import { randomBytes } from 'node:crypto';
import * as forge from 'node-forge';

/**
 * Creates a minimal valid PDF document for testing
 * @returns Promise resolving to PDF buffer
 */
export async function createTestPdf(): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]);
  page.drawText('Test PDF Document', {
    x: 50,
    y: 750,
    size: 12,
  });
  const pdfBytes = await pdfDoc.save({ useObjectStreams: false });
  return Buffer.from(pdfBytes);
}

/**
 * Creates a PDF with specific content for testing
 * @param text - Text to include in the PDF
 * @returns Promise resolving to PDF buffer
 */
export async function createTestPdfWithText(text: string): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]);
  page.drawText(text, {
    x: 50,
    y: 750,
    size: 12,
  });
  const pdfBytes = await pdfDoc.save({ useObjectStreams: false });
  return Buffer.from(pdfBytes);
}

/**
 * Creates a mock certificate chain for testing
 * @param count - Number of certificates in the chain (default: 1)
 * @returns Array of mock certificate bytes (DER-encoded X.509 certificates)
 */
export function createMockCertificateChain(count: number = 1): Uint8Array[] {
  const certificates: Uint8Array[] = [];
  for (let i = 0; i < count; i++) {
    const keyPair = forge.pki.rsa.generateKeyPair(2048);
    const cert = forge.pki.createCertificate();
    
    cert.version = 2; // X.509 v3
    cert.publicKey = keyPair.publicKey;
    cert.serialNumber = forge.util.bytesToHex(forge.random.getBytesSync(16));
    
    const now = new Date();
    cert.validity.notBefore = now;
    cert.validity.notAfter = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    
    cert.setSubject([
      { name: 'commonName', type: forge.pki.oids.commonName, value: `Test Certificate ${i + 1}` },
      { name: 'organizationName', type: forge.pki.oids.organizationName, value: 'Test Organization' },
      { name: 'countryName', type: forge.pki.oids.countryName, value: 'US' },
    ]);
    
    cert.setIssuer(cert.subject.attributes);
    
    cert.setExtensions([
      {
        name: 'basicConstraints',
        cA: false,
      },
      {
        name: 'keyUsage',
        digitalSignature: true,
        nonRepudiation: true,
        keyEncipherment: false,
        dataEncipherment: false,
      },
      {
        name: 'extKeyUsage',
        serverAuth: false,
        clientAuth: false,
        codeSigning: false,
        emailProtection: false,
        timeStamping: false,
      },
    ]);
    
    cert.sign(keyPair.privateKey);
    
    const certAsn1 = forge.pki.certificateToAsn1(cert);
    const certDer = forge.asn1.toDer(certAsn1).getBytes();
    certificates.push(new Uint8Array(Buffer.from(certDer, 'binary')));
  }
  return certificates;
}

/**
 * Creates mock signature bytes for testing
 * @param size - Size of signature bytes (default: 256)
 * @returns Mock signature bytes
 */
export function createMockSignatureBytes(size: number = 256): Uint8Array {
  return new Uint8Array(randomBytes(size));
}

/**
 * Creates a mock signer info object for testing
 * @param overrides - Optional overrides for signer info
 * @returns Mock signer info object
 */
export function createMockSignerInfo(overrides: {
  name?: string;
  email?: string;
  location?: string;
  reason?: string;
} = {}) {
  return {
    name: overrides.name || 'Test Signer',
    email: overrides.email || 'test@example.com',
    location: overrides.location || 'US',
    reason: overrides.reason || 'I agree to sign this document',
  };
}

/**
 * Creates a PDF with signature indicators (simulates already signed PDF)
 * @returns Promise resolving to PDF buffer with signature indicators
 */
export async function createTestPdfWithSignatures(): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]);
  page.drawText('Signed PDF Document', {
    x: 50,
    y: 750,
    size: 12,
  });
  const pdfBytes = await pdfDoc.save();
  const pdfString = Buffer.from(pdfBytes).toString('latin1');
  const signedPdfString = pdfString.replace(
    'endobj',
    'endobj\n/Sig\n/ByteRange\n/Contents\n/Filter /Adobe.PPKLite\nendobj'
  );
  return Buffer.from(signedPdfString, 'latin1');
}

/**
 * Creates a minimal PDF structure string for testing
 * @returns PDF structure string
 */
export function createMinimalPdfStructure(): string {
  return `%PDF-1.7
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Resources <<
/Font <<
/F1 <<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
>>
>>
/Contents 4 0 R
>>
endobj
4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
50 750 Td
(Test) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000250 00000 n
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
350
%%EOF`;
}

