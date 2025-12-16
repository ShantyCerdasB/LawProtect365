// @ts-nocheck
/**
 * @fileoverview Footer Logo Component Tests
 * @summary Tests for the FooterLogo component
 */

/// <reference types="@testing-library/jest-dom" />
import React from 'react';
import { describe, it, expect, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { renderWithProviders } from '@/__tests__/helpers';
import { FooterLogo } from '@/ui-kit/layout/components/FooterLogo';

jest.mock('@lawprotect/frontend-core', () => ({
  useTranslation: jest.fn(() => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'footer.mission': 'Our mission statement',
      };
      return translations[key] || key;
    },
  })),
}));

describe('FooterLogo', () => {
  it('should render footer logo with image', () => {
    renderWithProviders(<FooterLogo />);
    
    const img = screen.getByAltText('Law Protect 365');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/lawProtectLogo.png');
  });

  it('should render mission statement', () => {
    renderWithProviders(<FooterLogo />);
    
    expect(screen.getByText('Our mission statement')).toBeInTheDocument();
  });

  it('should have proper image classes', () => {
    renderWithProviders(<FooterLogo />);
    
    const img = screen.getByAltText('Law Protect 365');
    expect(img).toHaveClass('h-24', 'md:h-32', 'lg:h-36', 'object-contain');
  });

  it('should have proper mission text classes', () => {
    renderWithProviders(<FooterLogo />);
    
    const mission = screen.getByText('Our mission statement');
    expect(mission).toHaveClass(
      'text-white',
      'text-sm',
      'md:text-base',
      'leading-relaxed',
      'max-w-md',
      'text-center',
      'md:text-left'
    );
  });
});


