/**
 * @file SigningPdfService.ts
 * @summary Service for generating signed PDFs with embedded signatures
 * @description Handles the creation of final signed PDFs containing all signatures and metadata
 */

import type { EnvelopeId, PartyId } from "@/domain/value-objects/ids";
import type { Party } from "@/domain/entities/Party";
import type { S3SignedPdfIngestor } from "@/infrastructure/s3/S3SignedPdfIngestor";
import { PDFDocument } from "pdf-lib";
import { signatureFailed } from "@/shared/errors";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

/**
 * Interface for signature metadata
 */
export interface SignatureMetadata {
  /** Party ID who signed */
  partyId: PartyId;
  /** Party name */
  partyName: string;
  /** Party email */
  partyEmail: string;
  /** Signature timestamp */
  signedAt: string;
  /** KMS signature (base64) */
  signature: string;
  /** Document digest that was signed */
  digest: string;
  /** Signing algorithm used */
  algorithm: string;
  /** KMS key ID used */
  keyId: string;
}

/**
 * Interface for signed PDF generation result
 */
export interface SignedPdfResult {
  /** S3 object key where PDF was stored */
  objectKey: string;
  /** S3 bucket where PDF was stored */
  bucket: string;
  /** HTTPS URL to access the PDF */
  httpUrl: string;
  /** ETag from S3 */
  etag?: string;
  /** Version ID from S3 */
  versionId?: string;
}

/**
 * Service for generating signed PDFs
 */
export class SigningPdfService {
  constructor(
    private readonly pdfIngestor: S3SignedPdfIngestor,
    private readonly signedBucket: string
  ) {}

  /**
   * Generates a final signed PDF containing all signatures
   * @param envelopeId - Envelope identifier
   * @param finalPdfUrl - URL of the final PDF from Documents Service
   * @param parties - All parties in the envelope
   * @param signatures - All signatures with metadata
   * @returns Promise resolving to signed PDF result
   */
  async generateSignedPdf(
    envelopeId: EnvelopeId,
    finalPdfUrl: string,
    parties: Party[],
    signatures: SignatureMetadata[]
  ): Promise<SignedPdfResult> {
    // Download the original PDF from Documents Service
    const originalPdfBuffer = await this.downloadPdfFromDocumentsService(finalPdfUrl);
    
    // Create signed PDF with embedded signatures
    const signedPdfBuffer = await this.createSignedPdfBuffer(parties, signatures, originalPdfBuffer);
    
    // Generate S3 key for the signed document
    const objectKey = `envelopes/${envelopeId}/signed/document.pdf`;
    
    // Store the signed PDF in S3
    const result = await this.pdfIngestor.ingest({
      bucket: this.signedBucket,
      key: objectKey,
      body: signedPdfBuffer,
      metadata: {
        envelopeId: envelopeId,
        signedAt: new Date().toISOString(),
        signatureCount: signatures.length.toString(),
        signers: signatures.map(s => s.partyEmail).join(',')
      }
    });

    return {
      objectKey,
      bucket: this.signedBucket,
      httpUrl: result.httpUrl,
      etag: result.etag,
      versionId: result.versionId
    };
  }

  /**
   * Creates a PDF buffer with embedded signatures
   * @param parties - All parties
   * @param signatures - All signatures
   * @param originalPdfBuffer - The original PDF buffer from Documents Service
   * @returns Promise resolving to PDF buffer
   */
  private async createSignedPdfBuffer(
    parties: Party[],
    signatures: SignatureMetadata[],
    originalPdfBuffer: Buffer
  ): Promise<Buffer> {
    try {
      // 1. Load the PDF with pdf-lib
      const pdfDoc = await PDFDocument.load(originalPdfBuffer);
      
      // 2. Add signature metadata (no visual signatures needed - already in PDF from Documents Service)
      await this.addSignatureMetadata(pdfDoc, parties, signatures);
      
      // 3. Return the final PDF buffer
      const pdfBytes = await pdfDoc.save();
      return Buffer.from(pdfBytes);
      
    } catch (error) {
      console.error('Failed to create signed PDF buffer:', error);
      throw signatureFailed({ error: String(error) });
    }
  }

  /**
   * Downloads the original PDF from Documents Service
   * @param finalPdfUrl - URL of the final PDF from Documents Service
   * @returns Promise resolving to PDF buffer
   */
  private async downloadPdfFromDocumentsService(finalPdfUrl: string): Promise<Buffer> {
    
    try {
      // Check if this is a LocalStack S3 URL (for testing)
      if (finalPdfUrl.includes('localhost:4566') && finalPdfUrl.includes('/test-signed/')) {
        console.log('🔍 [PDF DEBUG] Detected LocalStack S3 URL, using S3 client directly');
        
        // Extract bucket and key from URL
        const url = new URL(finalPdfUrl);
        const bucketName = url.hostname === 'localhost' ? 'test-signed' : url.pathname.split('/')[1];
        const key = url.pathname.split('/').slice(2).join('/');
        
        console.log('🔍 [PDF DEBUG] Bucket:', bucketName, 'Key:', key);
        
        // Use S3 client to download
        const s3Client = new S3Client({
          endpoint: 'http://localhost:4566',
          region: 'us-east-1',
          credentials: {
            accessKeyId: 'test',
            secretAccessKey: 'test'
          },
          forcePathStyle: true
        });
        
        const command = new GetObjectCommand({
          Bucket: bucketName,
          Key: key
        });
        
        const response = await s3Client.send(command);
        const chunks: Uint8Array[] = [];
        
        if (response.Body) {
          for await (const chunk of response.Body as any) {
            chunks.push(chunk);
          }
        }
        
        const buffer = Buffer.concat(chunks);
        console.log('🔍 [PDF DEBUG] Successfully downloaded PDF from S3, size:', buffer.length);
        return buffer;
      }
      
      // For production URLs, use fetch
      console.log('🔍 [PDF DEBUG] Using fetch for production URL');
      const response = await fetch(finalPdfUrl);
      
      if (!response.ok) {
        throw signatureFailed({ 
          message: `Failed to download PDF from Documents Service: ${response.status} ${response.statusText}`,
          status: response.status,
          statusText: response.statusText
        });
      }
      
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
      
    } catch (error) {
      console.error('🔍 [PDF DEBUG] Error downloading PDF:', error);
      throw signatureFailed({ error: String(error) });
    }
  }


  /**
   * Adds signature metadata to the PDF (no visual signatures - already embedded by Documents Service)
   * @param pdfDoc - PDF document to modify
   * @param parties - All parties
   * @param signatures - All signatures
   */
  private async addSignatureMetadata(
    pdfDoc: PDFDocument,
    _parties: Party[],
    signatures: SignatureMetadata[]
  ): Promise<void> {
    // Add signature metadata to document info (invisible metadata for legal validation)
    pdfDoc.setTitle(`Signed Document`);
    pdfDoc.setSubject(`Document signed by ${signatures.length} parties`);
    pdfDoc.setAuthor('LawProtect365 Signature Service');
    pdfDoc.setCreator('LawProtect365');
    pdfDoc.setProducer('LawProtect365 PDF Signing Service');
    pdfDoc.setKeywords(['signed', 'legal', 'document', 'signature']);
    
    // Add custom properties for audit trail
    pdfDoc.setSubject(`Document signed by ${signatures.length} parties - Signers: ${signatures.map(s => s.partyEmail).join(',')}`);
  }


}
