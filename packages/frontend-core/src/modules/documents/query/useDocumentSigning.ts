/**
 * @fileoverview useDocumentSigning Hook - React hook for PDF document signing workflow
 * @summary Custom hook for managing document signing state and operations
 * @description
 * Provides a React hook to manage the complete document signing workflow:
 * - Managing signature placements (add, remove, update)
 * - Applying signatures to PDF using the use-case
 * - Converting signed PDF to base64 for API submission
 * This hook is platform-agnostic and can be used in both web and mobile apps.
 */

import { useState, useCallback } from 'react';
import type { PDFCoordinates, SignaturePlacement, UseDocumentSigningConfig, UseDocumentSigningResult } from '../types';
import { applySignatureToPdf } from '../use-cases';

/**
 * @description React hook for managing PDF document signing workflow.
 * @param config Configuration with PDF source
 * @returns Hook result with signature management functions
 *
 * @example
 * ```tsx
 * const { signatures, addSignature, applySignatures } = useDocumentSigning({
 *   pdfSource: pdfFile
 * });
 *
 * const handleSignatureConfirm = (image: string, coords: PDFCoordinates) => {
 *   addSignature(image, coords);
 * };
 *
 * const handleSubmit = async () => {
 *   const signedPdfBase64 = await applySignatures();
 *   await signDocument(httpClient, envelopeId, { signedDocument: signedPdfBase64 });
 * };
 * ```
 */
export function useDocumentSigning(config: UseDocumentSigningConfig): UseDocumentSigningResult {
  const { pdfSource } = config;
  const [signatures, setSignatures] = useState<SignaturePlacement[]>([]);
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * @description Adds a new signature placement to the document.
   * @param signatureImage Signature image as data URL or base64 string
   * @param coordinates PDF coordinates where signature should be placed
   */
  const addSignature = useCallback((signatureImage: string, coordinates: PDFCoordinates) => {
    setSignatures((prev) => [
      ...prev,
      {
        signatureImage,
        coordinates,
      },
    ]);
    setError(null);
  }, []);

  /**
   * @description Removes a signature placement by index.
   * @param index Index of the signature to remove
   */
  const removeSignature = useCallback((index: number) => {
    setSignatures((prev) => prev.filter((_, i) => i !== index));
    setError(null);
  }, []);

  /**
   * @description Clears all signature placements from the document.
   */
  const clearSignatures = useCallback(() => {
    setSignatures([]);
    setError(null);
  }, []);

  /**
   * @description Applies all signatures to the PDF and returns as base64 string.
   * @returns Promise resolving to signed PDF as base64 string
   * @throws Error if no signatures are present or if applying signatures fails
   * @description
   * Validates that at least one signature exists, converts the PDF source to Uint8Array,
   * applies all signatures using the use-case, and converts the result to a base64 string.
   * This method is useful when submitting the signed PDF to APIs that expect base64-encoded data.
   */
  const applySignatures = useCallback(async (): Promise<string> => {
    if (signatures.length === 0) {
      const errorMsg = 'Please add at least one signature';
      setError(errorMsg);
      throw new Error(errorMsg);
    }

    setIsApplying(true);
    setError(null);

    try {
      // Convert pdfSource to Uint8Array
      let pdfBytes: Uint8Array;
      if (typeof pdfSource === 'string') {
        // Assume base64 string
        const binaryString = atob(pdfSource.includes(',') ? pdfSource.split(',')[1] : pdfSource);
        pdfBytes = Uint8Array.from(binaryString, (c) => c.charCodeAt(0));
      } else if (pdfSource instanceof ArrayBuffer) {
        pdfBytes = new Uint8Array(pdfSource);
      } else {
        pdfBytes = pdfSource;
      }

      // Apply signatures using use-case
      const signedPdfBytes = await applySignatureToPdf(pdfBytes, signatures);

      // Convert to base64
      const base64 = btoa(String.fromCharCode(...signedPdfBytes));

      setIsApplying(false);
      return base64;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to apply signatures to PDF';
      setError(errorMsg);
      setIsApplying(false);
      throw err;
    }
  }, [pdfSource, signatures]);

  return {
    signatures,
    addSignature,
    removeSignature,
    clearSignatures,
    applySignatures,
    isApplying,
    error,
  };
}

