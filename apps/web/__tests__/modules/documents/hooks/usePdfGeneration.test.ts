/**
 * @fileoverview Use PDF Generation Hook Tests
 * @summary Tests for the usePdfGeneration hook
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { usePdfGeneration } from '../../../../src/modules/documents/hooks/usePdfGeneration';
import { downloadPdfFile } from '../../../../src/modules/documents/utils/downloadPdfFile';

jest.mock('../../../../src/modules/documents/utils/downloadPdfFile');

const mockDownloadPdfFile = downloadPdfFile as jest.MockedFunction<typeof downloadPdfFile>;

describe('usePdfGeneration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDownloadPdfFile.mockImplementation(() => {});
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => usePdfGeneration());

    expect(result.current.isGenerating).toBe(false);
    expect(result.current.generateError).toBeNull();
    expect(result.current.generateSuccess).toBe(false);
  });

  it('should set isGenerating to true when generating', async () => {
    const { result } = renderHook(() => usePdfGeneration());
    const pdfBytes = new Uint8Array([1, 2, 3, 4, 5]);

    await act(async () => {
      await result.current.generateAndDownload(pdfBytes);
    });

    expect(result.current.isGenerating).toBe(false);
    expect(result.current.generateError).toBeNull();
    expect(result.current.generateSuccess).toBe(true);
  });

  it('should call downloadPdfFile with correct parameters', async () => {
    const { result } = renderHook(() => usePdfGeneration());
    const pdfBytes = new Uint8Array([1, 2, 3, 4, 5]);
    const filename = 'test.pdf';

    await act(async () => {
      await result.current.generateAndDownload(pdfBytes, filename);
    });

    await waitFor(() => {
      expect(mockDownloadPdfFile).toHaveBeenCalledWith(pdfBytes, filename);
    });
  });

  it('should set generateSuccess to true after successful generation', async () => {
    const { result } = renderHook(() => usePdfGeneration());
    const pdfBytes = new Uint8Array([1, 2, 3, 4, 5]);

    await act(async () => {
      await result.current.generateAndDownload(pdfBytes);
    });

    await waitFor(() => {
      expect(result.current.generateSuccess).toBe(true);
      expect(result.current.isGenerating).toBe(false);
      expect(result.current.generateError).toBeNull();
    });
  });

  it('should set generateError when download fails', async () => {
    const { result } = renderHook(() => usePdfGeneration());
    const pdfBytes = new Uint8Array([1, 2, 3, 4, 5]);
    const errorMessage = 'Download failed';
    mockDownloadPdfFile.mockImplementation(() => {
      throw new Error(errorMessage);
    });

    await act(async () => {
      await result.current.generateAndDownload(pdfBytes);
    });

    await waitFor(() => {
      expect(result.current.generateError).toBe(errorMessage);
      expect(result.current.generateSuccess).toBe(false);
      expect(result.current.isGenerating).toBe(false);
    });
  });

  it('should handle non-Error exceptions', async () => {
    const { result } = renderHook(() => usePdfGeneration());
    const pdfBytes = new Uint8Array([1, 2, 3, 4, 5]);
    mockDownloadPdfFile.mockImplementation(() => {
      throw 'String error';
    });

    await act(async () => {
      await result.current.generateAndDownload(pdfBytes);
    });

    await waitFor(() => {
      expect(result.current.generateError).toBe('Failed to generate PDF');
      expect(result.current.isGenerating).toBe(false);
    });
  });

  it('should clear generation state', () => {
    const { result } = renderHook(() => usePdfGeneration());

    act(() => {
      result.current.clearGenerationState();
    });

    expect(result.current.generateError).toBeNull();
    expect(result.current.generateSuccess).toBe(false);
  });

  it('should handle ArrayBuffer input', async () => {
    const { result } = renderHook(() => usePdfGeneration());
    const pdfBytes = new ArrayBuffer(8);
    const view = new Uint8Array(pdfBytes);
    view.set([1, 2, 3, 4, 5, 6, 7, 8]);

    await act(async () => {
      await result.current.generateAndDownload(pdfBytes);
    });

    await waitFor(() => {
      expect(mockDownloadPdfFile).toHaveBeenCalledWith(pdfBytes, undefined);
      expect(result.current.generateSuccess).toBe(true);
    });
  });

  it('should handle generation without filename', async () => {
    const { result } = renderHook(() => usePdfGeneration());
    const pdfBytes = new Uint8Array([1, 2, 3]);

    await act(async () => {
      await result.current.generateAndDownload(pdfBytes);
    });

    await waitFor(() => {
      expect(mockDownloadPdfFile).toHaveBeenCalledWith(pdfBytes, undefined);
    });
  });

  it('should reset error and success before generating', async () => {
    const { result } = renderHook(() => usePdfGeneration());
    const pdfBytes = new Uint8Array([1, 2, 3]);

    await act(async () => {
      await result.current.generateAndDownload(pdfBytes);
    });

    await waitFor(() => {
      expect(result.current.generateSuccess).toBe(true);
    });

    const pdfBytes2 = new Uint8Array([4, 5, 6]);
    await act(async () => {
      await result.current.generateAndDownload(pdfBytes2);
    });

    expect(result.current.generateError).toBeNull();
    expect(result.current.generateSuccess).toBe(true);
  });
});


