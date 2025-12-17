// @ts-nocheck
/**
 * @fileoverview Footer Bottom Component Tests
 * @summary Tests for the FooterBottom component
 */

import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/__tests__/helpers';
import { FooterBottom } from '@/ui-kit/layout/components/FooterBottom';

describe('FooterBottom', () => {
  const defaultProps = {
    copyright: '© 2024 Law Protect 365. All rights reserved.',
    privacyPolicyPath: '/privacy-policy',
    termsPath: '/terms-and-conditions',
  };

  it('should render copyright text', () => {
    renderWithProviders(<FooterBottom {...defaultProps} />);
    
    expect(screen.getByText(defaultProps.copyright)).toBeInTheDocument();
  });

  it('should render privacy policy link', () => {
    renderWithProviders(<FooterBottom {...defaultProps} />);
    
    const privacyLink = screen.getByRole('link', { name: /privacy policy/i });
    expect(privacyLink).toBeInTheDocument();
    expect(privacyLink).toHaveAttribute('href', '/privacy-policy');
  });

  it('should render terms and conditions link', () => {
    renderWithProviders(<FooterBottom {...defaultProps} />);
    
    const termsLink = screen.getByRole('link', { name: /terms & conditions/i });
    expect(termsLink).toBeInTheDocument();
    expect(termsLink).toHaveAttribute('href', '/terms-and-conditions');
  });

  it('should have proper container styling', () => {
    const { container } = renderWithProviders(<FooterBottom {...defaultProps} />);
    const mainDiv = container.firstChild as HTMLElement;
    
    expect(mainDiv).toHaveClass('w-full', 'pt-8', 'mt-12');
  });

  it('should have border separator', () => {
    const { container } = renderWithProviders(<FooterBottom {...defaultProps} />);
    const border = container.querySelector('.border-t');
    
    expect(border).toBeInTheDocument();
    expect(border).toHaveClass('border-white/20');
  });

  it('should have responsive flex layout', () => {
    const { container } = renderWithProviders(<FooterBottom {...defaultProps} />);
    const flexContainer = container.querySelector('.flex.flex-col');
    
    expect(flexContainer).toBeInTheDocument();
    expect(flexContainer).toHaveClass('md:flex-row');
  });

  it('should have proper link styling', () => {
    renderWithProviders(<FooterBottom {...defaultProps} />);
    
    const privacyLink = screen.getByRole('link', { name: /privacy policy/i });
    expect(privacyLink).toHaveClass('text-white', 'text-sm', 'hover:text-emerald');
  });

  it('should render links in a flex container', () => {
    const { container } = renderWithProviders(<FooterBottom {...defaultProps} />);
    const linksContainer = container.querySelector('.flex.gap-8');
    
    expect(linksContainer).toBeInTheDocument();
    expect(linksContainer).toHaveClass('md:gap-12');
  });

  it('should center items on mobile and space between on desktop', () => {
    const { container } = renderWithProviders(<FooterBottom {...defaultProps} />);
    const flexContainer = container.querySelector('.flex.flex-col');
    
    expect(flexContainer).toHaveClass('justify-between', 'items-center');
  });
});



