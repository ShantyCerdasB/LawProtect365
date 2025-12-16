/**
 * @fileoverview Use PDF File Upload Hook Tests
 * @summary Tests for the usePdfFileUpload hook
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { usePdfFileUpload } from '@/modules/documents/hooks/usePdfFileUpload';

describe('usePdfFileUpload', () => {
  it('should initialize with null file and source', () => {
    const { result } = renderHook(() => usePdfFileUpload());

    expect(result.current.pdfFile).toBeNull();
    expect(result.current.pdfSource).toBeNull();
  });

  it('should handle PDF file upload', async () => {
    const { result } = renderHook(() => usePdfFileUpload());
    const arrayBuffer = new ArrayBuffer(10);
    const file = new File(['pdf content'], 'test.pdf', { type: 'application/pdf' });
    file.arrayBuffer = jest.fn().mockResolvedValue(arrayBuffer);
    const input = document.createElement('input');
    input.type = 'file';
    Object.defineProperty(input, 'files', {
      value: [file],
      writable: false,
    });
    const mockEvent = {
      target: input,
      currentTarget: input,
    } as React.ChangeEvent<HTMLInputElement>;

    await act(async () => {
      await result.current.handleFileUpload(mockEvent);
    });

    await waitFor(() => {
      expect(result.current.pdfFile).toBe(file);
      expect(result.current.pdfSource).toBeInstanceOf(ArrayBuffer);
    });
  });

  it('should not handle non-PDF file upload', async () => {
    const { result } = renderHook(() => usePdfFileUpload());
    const file = new File(['image content'], 'test.jpg', { type: 'image/jpeg' });
    const mockEvent = {
      target: {
        files: [file],
      },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    await act(async () => {
      await result.current.handleFileUpload(mockEvent);
    });

    expect(result.current.pdfFile).toBeNull();
    expect(result.current.pdfSource).toBeNull();
  });

  it('should handle empty file selection', async () => {
    const { result } = renderHook(() => usePdfFileUpload());
    const mockEvent = {
      target: {
        files: null,
      },
    } as any;

    await act(async () => {
      await result.current.handleFileUpload(mockEvent);
    });

    expect(result.current.pdfFile).toBeNull();
    expect(result.current.pdfSource).toBeNull();
  });

  it('should clear file and source', async () => {
    const { result } = renderHook(() => usePdfFileUpload());
    const arrayBuffer = new ArrayBuffer(10);
    const file = new File(['pdf content'], 'test.pdf', { type: 'application/pdf' });
    file.arrayBuffer = jest.fn().mockResolvedValue(arrayBuffer);
    const input = document.createElement('input');
    input.type = 'file';
    Object.defineProperty(input, 'files', {
      value: [file],
      writable: false,
    });
    const mockEvent = {
      target: input,
      currentTarget: input,
    } as React.ChangeEvent<HTMLInputElement>;

    await act(async () => {
      await result.current.handleFileUpload(mockEvent);
    });

    await waitFor(() => {
      expect(result.current.pdfFile).toBe(file);
    });

    act(() => {
      result.current.clearFile();
    });

    expect(result.current.pdfFile).toBeNull();
    expect(result.current.pdfSource).toBeNull();
  });

  it('should convert file to ArrayBuffer', async () => {
    const { result } = renderHook(() => usePdfFileUpload());
    const fileContent = new Uint8Array([1, 2, 3, 4, 5]);
    const arrayBuffer = fileContent.buffer;
    const file = new File([fileContent], 'test.pdf', { type: 'application/pdf' });
    file.arrayBuffer = jest.fn().mockResolvedValue(arrayBuffer);
    const input = document.createElement('input');
    input.type = 'file';
    Object.defineProperty(input, 'files', {
      value: [file],
      writable: false,
    });
    const mockEvent = {
      target: input,
      currentTarget: input,
    } as React.ChangeEvent<HTMLInputElement>;

    await act(async () => {
      await result.current.handleFileUpload(mockEvent);
    });

    await waitFor(() => {
      expect(result.current.pdfSource).toBeInstanceOf(ArrayBuffer);
      if (result.current.pdfSource) {
        const view = new Uint8Array(result.current.pdfSource);
        expect(view).toEqual(fileContent);
      }
    });
  });

  it('should handle multiple file selections by using first file', async () => {
    const { result } = renderHook(() => usePdfFileUpload());
    const arrayBuffer = new ArrayBuffer(10);
    const file1 = new File(['pdf content 1'], 'test1.pdf', { type: 'application/pdf' });
    file1.arrayBuffer = jest.fn().mockResolvedValue(arrayBuffer);
    const file2 = new File(['pdf content 2'], 'test2.pdf', { type: 'application/pdf' });
    const input = document.createElement('input');
    input.type = 'file';
    Object.defineProperty(input, 'files', {
      value: [file1, file2],
      writable: false,
    });
    const mockEvent = {
      target: input,
      currentTarget: input,
    } as React.ChangeEvent<HTMLInputElement>;

    await act(async () => {
      await result.current.handleFileUpload(mockEvent);
    });

    await waitFor(() => {
      expect(result.current.pdfFile).toBe(file1);
    });
  });
});


