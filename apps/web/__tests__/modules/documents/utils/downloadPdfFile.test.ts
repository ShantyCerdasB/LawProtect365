/**
 * @fileoverview Download PDF File Utility Tests
 * @summary Tests for the downloadPdfFile utility function
 */

import { downloadPdfFile } from '@app/modules/documents/utils/downloadPdfFile';

describe('downloadPdfFile', () => {
  let mockLink: HTMLAnchorElement;
  let mockUrl: string;

  beforeEach(() => {
    mockLink = document.createElement('a');
    mockUrl = 'blob:http://localhost:3000/test-url';
    
    jest.spyOn(document, 'createElement').mockReturnValue(mockLink);
    global.URL.createObjectURL = jest.fn(() => mockUrl);
    global.URL.revokeObjectURL = jest.fn();
    jest.spyOn(mockLink, 'click').mockImplementation(() => {});
    jest.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink);
    jest.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink);
    
    jest.spyOn(Date, 'now').mockReturnValue(1234567890);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should create blob from Uint8Array', () => {
    const pdfBytes = new Uint8Array([1, 2, 3, 4]);
    
    downloadPdfFile(pdfBytes);
    
    expect(URL.createObjectURL).toHaveBeenCalled();
    const blob = (URL.createObjectURL as jest.Mock).mock.calls[0][0];
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('application/pdf');
  });

  it('should create blob from ArrayBuffer', () => {
    const pdfBytes = new ArrayBuffer(4);
    
    downloadPdfFile(pdfBytes);
    
    expect(URL.createObjectURL).toHaveBeenCalled();
  });

  it('should create anchor element with download attribute', () => {
    const pdfBytes = new Uint8Array([1, 2, 3]);
    
    downloadPdfFile(pdfBytes, 'test-file.pdf');
    
    expect(document.createElement).toHaveBeenCalledWith('a');
    expect(mockLink.href).toBe(mockUrl);
    expect(mockLink.download).toBe('test-file.pdf');
  });

  it('should use default filename when not provided', () => {
    const pdfBytes = new Uint8Array([1, 2, 3]);
    
    downloadPdfFile(pdfBytes);
    
    expect(mockLink.download).toBe('signed-document-1234567890.pdf');
  });

  it('should append link to document body', () => {
    const pdfBytes = new Uint8Array([1, 2, 3]);
    
    downloadPdfFile(pdfBytes);
    
    expect(document.body.appendChild).toHaveBeenCalledWith(mockLink);
  });

  it('should trigger click on link', () => {
    const pdfBytes = new Uint8Array([1, 2, 3]);
    
    downloadPdfFile(pdfBytes);
    
    expect(mockLink.click).toHaveBeenCalled();
  });

  it('should remove link from document body', () => {
    const pdfBytes = new Uint8Array([1, 2, 3]);
    
    downloadPdfFile(pdfBytes);
    
    expect(document.body.removeChild).toHaveBeenCalledWith(mockLink);
  });

  it('should revoke object URL', () => {
    const pdfBytes = new Uint8Array([1, 2, 3]);
    
    downloadPdfFile(pdfBytes);
    
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(mockUrl);
  });
});





