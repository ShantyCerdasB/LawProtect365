/**
 * @fileoverview Tests for useTranslation hook
 * @summary Unit tests for translation hook
 * @description Comprehensive tests for the useTranslation hook wrapper
 * @jest-environment jsdom
 */

import { renderHook } from '@testing-library/react-hooks';
import { useTranslation } from '../../../src/i18n/hooks/useTranslation';

jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(),
}));

import { useTranslation as useI18nextTranslation } from 'react-i18next';

describe('useTranslation', () => {
  const mockUseI18nextTranslation = useI18nextTranslation as jest.MockedFunction<typeof useI18nextTranslation>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call react-i18next useTranslation with no namespace', () => {
    const mockT = jest.fn((key: string) => key) as any;
    const mockI18n = {} as any;
    const mockReturn: [typeof mockT, typeof mockI18n, boolean] = [mockT, mockI18n, true];
    mockUseI18nextTranslation.mockReturnValue(mockReturn as any);

    const { result } = renderHook(() => useTranslation());

    expect(mockUseI18nextTranslation).toHaveBeenCalledWith(undefined);
    expect(result.current[0]).toBe(mockT);
    expect(result.current[1]).toBe(mockI18n);
    expect(result.current[2]).toBe(true);
  });

  it('should call react-i18next useTranslation with namespace', () => {
    const mockT = jest.fn((key: string) => key) as any;
    const mockI18n = {} as any;
    const mockReturn: [typeof mockT, typeof mockI18n, boolean] = [mockT, mockI18n, true];
    mockUseI18nextTranslation.mockReturnValue(mockReturn as any);

    const { result } = renderHook(() => useTranslation('common'));

    expect(mockUseI18nextTranslation).toHaveBeenCalledWith('common');
    expect(result.current[0]).toBe(mockT);
  });

  it('should pass through translation function', () => {
    const mockT = jest.fn((key: string) => key) as any;
    const mockI18n = {} as any;
    const mockReturn: [typeof mockT, typeof mockI18n, boolean] = [mockT, mockI18n, true];
    mockUseI18nextTranslation.mockReturnValue(mockReturn as any);

    const { result } = renderHook(() => useTranslation());

    expect(result.current[0]).toBe(mockT);
  });

  it('should pass through i18n instance', () => {
    const mockT = jest.fn((key: string) => key) as any;
    const mockI18n = { language: 'en' } as any;
    const mockReturn: [typeof mockT, typeof mockI18n, boolean] = [mockT, mockI18n, true];
    mockUseI18nextTranslation.mockReturnValue(mockReturn as any);

    const { result } = renderHook(() => useTranslation());

    expect(result.current[1]).toBe(mockI18n);
  });
});


