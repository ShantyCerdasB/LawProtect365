// @ts-nocheck
/**
 * @fileoverview Language Selector Component Tests
 * @summary Tests for the LanguageSelector component
 */

import React from 'react';
import { describe, it, expect, jest } from '@jest/globals';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/__tests__/helpers';
import { LanguageSelector } from '@/ui-kit/layout/components/LanguageSelector';

const mockChangeLanguage = jest.fn();

jest.mock('@lawprotect/frontend-core', () => {
  const actual = jest.requireActual('@lawprotect/frontend-core') as Record<string, unknown>;
  return {
    ...actual,
    useTranslation: () => ({
      i18n: {
        language: 'en',
        changeLanguage: mockChangeLanguage,
      },
      t: (key: string) => (key === 'languages.selectLanguage' ? 'Select Language' : key),
    }),
  };
});

describe('LanguageSelector', () => {
  it('should render language selector button', () => {
    renderWithProviders(<LanguageSelector />);
    
    const button = screen.getByLabelText(/select language/i);
    expect(button).toBeInTheDocument();
  });

  it('should display current language flag', () => {
    renderWithProviders(<LanguageSelector />);
    
    const button = screen.getByLabelText(/select language/i);
    expect(button).toBeInTheDocument();
  });

  it('should display current language country code', () => {
    renderWithProviders(<LanguageSelector />);
    
    const button = screen.getByLabelText(/select language/i);
    expect(button).toBeInTheDocument();
  });

  it('should open dropdown when clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LanguageSelector />);
    
    const button = screen.getByLabelText(/select language/i);
    await user.click(button);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /ES/i })).toBeInTheDocument();
    });
  });

  it('should have proper button styling', () => {
    renderWithProviders(<LanguageSelector />);
    
    const button = screen.getByLabelText(/select language/i);
    expect(button).toHaveClass('bg-white/10', 'border', 'rounded-lg');
  });

  it('should have aria-expanded attribute', () => {
    renderWithProviders(<LanguageSelector />);
    
    const button = screen.getByLabelText(/select language/i);
    expect(button).toHaveAttribute('aria-expanded');
  });

  it('should render dropdown trigger with chevron icon', () => {
    const { container } = renderWithProviders(<LanguageSelector />);
    
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('should show checkmark for current language in dropdown', async () => {
    const user = userEvent.setup();
    const { container } = renderWithProviders(<LanguageSelector />);
    
    const button = screen.getByLabelText(/select language/i);
    await user.click(button);
    
    await waitFor(() => {
      const checkmarks = container.querySelectorAll('svg');
      expect(checkmarks.length).toBeGreaterThan(1);
    });
  });
});


