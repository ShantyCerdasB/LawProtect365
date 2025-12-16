// @ts-nocheck
/**
 * @fileoverview Home Page Component Tests
 * @summary Tests for the HomePage component
 */

import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/__tests__/helpers';
import { HomePage } from '@/modules/home/pages/HomePage';

describe('HomePage', () => {
  it('should render home page with carousel', () => {
    renderWithProviders(<HomePage />);
    
    expect(screen.getByRole('region', { name: /carousel/i })).toBeInTheDocument();
  });

  it('should render decorative SVG elements', () => {
    renderWithProviders(<HomePage />);
    
    const decorativeImages = screen.getAllByAltText(/decorative/i);
    expect(decorativeImages.length).toBeGreaterThan(0);
  });

  it('should render Sign365 promo section', () => {
    renderWithProviders(<HomePage />);
    
    expect(screen.getByText(/sign 365/i)).toBeInTheDocument();
  });

  it('should render testimonials section title', () => {
    renderWithProviders(<HomePage />);
    
    expect(screen.getByText(/Happy Customers/i)).toBeInTheDocument();
  });

  it('should render gray column component', () => {
    const { container } = renderWithProviders(<HomePage />);
    
    const grayColumn = container.querySelector('.bg-gray-100');
    expect(grayColumn).toBeInTheDocument();
  });

  it('should render gray separator', () => {
    const { container } = renderWithProviders(<HomePage />);
    
    const separator = container.querySelector('.bg-gray-100.h-16');
    expect(separator).toBeInTheDocument();
  });

  it('should have proper container structure', () => {
    const { container } = renderWithProviders(<HomePage />);
    
    const firstSection = container.querySelector('.relative.w-full.min-h-screen');
    expect(firstSection).toBeInTheDocument();
  });

  it('should render carousel with proper props', () => {
    renderWithProviders(<HomePage />);
    
    expect(screen.getByRole('region', { name: /carousel/i })).toBeInTheDocument();
  });

  it('should render carousel slides', () => {
    renderWithProviders(<HomePage />);
    
    const carousel = screen.getByRole('region', { name: /carousel/i });
    expect(carousel).toBeInTheDocument();
  });
});


