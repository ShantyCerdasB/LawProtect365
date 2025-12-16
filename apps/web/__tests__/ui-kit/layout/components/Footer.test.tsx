// @ts-nocheck
/**
 * @fileoverview Footer Component Tests
 * @summary Tests for the Footer component
 */

import React from 'react';
import { describe, it, expect } from '@jest/globals';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/__tests__/helpers';
import { Footer } from '@/ui-kit/layout/components/Footer';

describe('Footer', () => {
  it('should render footer with logo', () => {
    renderWithProviders(<Footer />);
    
    expect(screen.getByAltText('Law Protect 365')).toBeInTheDocument();
  });

  it('should render working hours section', () => {
    renderWithProviders(<Footer />);
    
    expect(screen.getByText(/working hours/i)).toBeInTheDocument();
  });

  it('should render contact section title', () => {
    renderWithProviders(<Footer />);
    
    expect(screen.getAllByText(/contact us/i).length).toBeGreaterThan(0);
  });

  it('should render corporate office information', () => {
    renderWithProviders(<Footer />);
    
    expect(screen.getByText(/corporate office/i)).toBeInTheDocument();
  });

  it('should render beverly hills office information', () => {
    renderWithProviders(<Footer />);
    
    const beverlyHillsElements = screen.getAllByText(/beverly hills/i);
    expect(beverlyHillsElements.length).toBeGreaterThan(0);
  });

  it('should render footer bottom with copyright', () => {
    renderWithProviders(<Footer />);
    
    expect(screen.getByText(/All Rights Reserved/i)).toBeInTheDocument();
  });

  it('should render privacy policy link', () => {
    renderWithProviders(<Footer />);
    
    const privacyLink = screen.getByRole('link', { name: /privacy policy/i });
    expect(privacyLink).toBeInTheDocument();
    expect(privacyLink).toHaveAttribute('href', '/privacy-policy');
  });

  it('should render terms and conditions link', () => {
    renderWithProviders(<Footer />);
    
    const termsLink = screen.getByRole('link', { name: /terms & conditions/i });
    expect(termsLink).toBeInTheDocument();
    expect(termsLink).toHaveAttribute('href', '/terms-and-conditions');
  });

  it('should apply custom className', () => {
    const { container } = renderWithProviders(<Footer className="custom-footer" />);
    const footer = container.querySelector('footer');
    
    expect(footer).toHaveClass('custom-footer');
  });

  it('should have proper footer styling classes', () => {
    const { container } = renderWithProviders(<Footer />);
    const footer = container.querySelector('footer');
    
    expect(footer).toHaveClass('bg-emerald-dark', 'text-white', 'py-12', 'md:py-16');
  });

  it('should render office contact information with phone links', () => {
    renderWithProviders(<Footer />);
    
    const phoneLinks = screen.getAllByRole('link');
    const telLinks = phoneLinks.filter((link) => link.getAttribute('href')?.startsWith('tel:'));
    
    expect(telLinks.length).toBeGreaterThan(0);
  });

  it('should render office contact information with email links', () => {
    renderWithProviders(<Footer />);
    
    const emailLinks = screen.getAllByRole('link');
    const mailtoLinks = emailLinks.filter((link) => link.getAttribute('href')?.startsWith('mailto:'));
    
    expect(mailtoLinks.length).toBeGreaterThan(0);
  });
});


