// @ts-nocheck
/**
 * @fileoverview Sign365 Promo Section Component Tests
 * @summary Tests for the Sign365PromoSection component
 */

import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/__tests__/helpers';
import { Sign365PromoSection } from '@/ui-kit/layout/components/Sign365PromoSection';

describe('Sign365PromoSection', () => {
  it('should render with default props', () => {
    renderWithProviders(<Sign365PromoSection />);
    
    expect(screen.getByText('Sign 365')).toBeInTheDocument();
    expect(screen.getByText('Save time and money')).toBeInTheDocument();
  });

  it('should render title', () => {
    renderWithProviders(<Sign365PromoSection title="Custom Title" />);
    
    expect(screen.getByText('Custom Title')).toBeInTheDocument();
  });

  it('should render highlight text', () => {
    renderWithProviders(<Sign365PromoSection highlightText="Custom Highlight" />);
    
    expect(screen.getByText('Custom Highlight')).toBeInTheDocument();
  });

  it('should render subtitle', () => {
    renderWithProviders(<Sign365PromoSection subtitle="Custom Subtitle" />);
    
    expect(screen.getByText('Custom Subtitle')).toBeInTheDocument();
  });

  it('should render description', () => {
    const description = 'Custom description text';
    renderWithProviders(<Sign365PromoSection description={description} />);
    
    expect(screen.getByText(description)).toBeInTheDocument();
  });

  it('should render button with default label', () => {
    renderWithProviders(<Sign365PromoSection />);
    
    expect(screen.getByRole('link', { name: /learn more/i })).toBeInTheDocument();
  });

  it('should render button with custom label', () => {
    renderWithProviders(<Sign365PromoSection buttonLabel="Get Started" />);
    
    expect(screen.getByRole('link', { name: /get started/i })).toBeInTheDocument();
  });

  it('should have button link with default href', () => {
    renderWithProviders(<Sign365PromoSection />);
    
    const buttonLink = screen.getByRole('link', { name: /learn more/i });
    expect(buttonLink).toHaveAttribute('href', '/sign-365');
  });

  it('should have button link with custom href', () => {
    renderWithProviders(<Sign365PromoSection buttonHref="/custom-path" />);
    
    const buttonLink = screen.getByRole('link', { name: /learn more/i });
    expect(buttonLink).toHaveAttribute('href', '/custom-path');
  });

  it('should have background image with default src', () => {
    const { container } = renderWithProviders(<Sign365PromoSection />);
    const section = container.querySelector('section');
    
    expect(section).toHaveStyle({ backgroundImage: 'url(/Sign365Home.jpg)' });
  });

  it('should have background image with custom src', () => {
    const { container } = renderWithProviders(<Sign365PromoSection imageSrc="/custom-image.jpg" />);
    const section = container.querySelector('section');
    
    expect(section).toHaveStyle({ backgroundImage: 'url(/custom-image.jpg)' });
  });

  it('should render hidden image for accessibility', () => {
    renderWithProviders(<Sign365PromoSection />);
    
    const img = screen.getByAltText('Sign 365 promotional background');
    expect(img).toHaveClass('sr-only');
  });

  it('should have proper section styling', () => {
    const { container } = renderWithProviders(<Sign365PromoSection />);
    const section = container.querySelector('section');
    
    expect(section).toHaveClass('relative', 'w-full', 'bg-cover', 'bg-center', 'bg-no-repeat');
    expect(section).toHaveClass('min-h-[500px]', 'md:min-h-[700px]', 'lg:min-h-[800px]');
  });

  it('should apply custom className', () => {
    const { container } = renderWithProviders(<Sign365PromoSection className="custom-class" />);
    const section = container.querySelector('section');
    
    expect(section).toHaveClass('custom-class');
  });

  it('should break subtitle at specific phrases', () => {
    renderWithProviders(
      <Sign365PromoSection subtitle="with our digital signature for your legal documents" />
    );
    
    const subtitleElement = screen.getByText(/with our digital signature/i);
    expect(subtitleElement).toBeInTheDocument();
  });

  it('should have proper title styling', () => {
    renderWithProviders(<Sign365PromoSection />);
    
    const title = screen.getByText('Sign 365');
    expect(title).toHaveClass('text-5xl', 'md:text-6xl', 'lg:text-7xl', 'font-bold', 'text-emerald-dark');
  });

  it('should have proper highlight text styling', () => {
    const { container } = renderWithProviders(<Sign365PromoSection />);
    const highlight = screen.getByText('Save time and money');
    
    expect(highlight).toHaveClass('text-3xl', 'md:text-4xl', 'lg:text-5xl', 'font-semibold');
    expect(highlight).toHaveStyle({ color: '#003454' });
  });

  it('should have proper description styling', () => {
    renderWithProviders(<Sign365PromoSection />);
    
    const description = screen.getByText(/Digital signatures allow/i);
    expect(description).toHaveClass('text-lg', 'md:text-xl', 'lg:text-2xl', 'text-blue');
  });
});














