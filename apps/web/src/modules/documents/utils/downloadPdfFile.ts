/**
 * @fileoverview Download PDF File - Utility for downloading PDF files in the browser
 * @summary Web-specific utility for creating and triggering PDF file downloads
 * @description
 * Provides a reusable function to download PDF files in the browser by creating
 * a Blob, generating an object URL, creating a temporary anchor element, and
 * triggering a click. This is a web-specific utility that uses browser APIs.
 */

/**
 * @description Downloads a PDF file in the browser.
 * @param pdfBytes PDF file as Uint8Array or ArrayBuffer
 * @param filename Optional filename for the download (defaults to timestamped name)
 * @description
 * Creates a Blob from the PDF bytes, generates an object URL, creates a temporary
 * anchor element, triggers a click to download, and cleans up the URL and element.
 * 
 * Note: Uint8Array is compatible with Blob constructor, but TypeScript requires
 * an explicit cast to BlobPart for type safety.
 */
export function downloadPdfFile(pdfBytes: Uint8Array | ArrayBuffer, filename?: string): void {
  const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `signed-document-${Date.now()}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

