// @ts-nocheck
/**
 * @fileoverview Hero Section Component Tests
 * @summary Tests for the HeroSection component
 */

import { render, screen } from '@testing-library/react';
import { renderWithProviders } from '@/__tests__/helpers';
import { HeroSection } from '@app/modules/home/components/HeroSection';

describe('HeroSection', () => {
  it('should render hero section with title and subtitle', () => {
    renderWithProviders(
      <HeroSection
        title="Main Title"
        subtitle="Subtitle text"
      />
    );
    
    expect(screen.getByText('Main Title')).toBeInTheDocument();
    expect(screen.getByText('Subtitle text')).toBeInTheDocument();
  });

  it('should render description when provided', () => {
    renderWithProviders(
      <HeroSection
        title="Title"
        subtitle="Subtitle"
        description="Description text"
      />
    );
    
    expect(screen.getByText('Description text')).toBeInTheDocument();
  });

  it('should not render description when not provided', () => {
    renderWithProviders(
      <HeroSection
        title="Title"
        subtitle="Subtitle"
      />
    );
    
    expect(screen.queryByText(/Description/)).not.toBeInTheDocument();
  });

  it('should render title as h1', () => {
    renderWithProviders(
      <HeroSection
        title="Main Title"
        subtitle="Subtitle"
      />
    );
    
    const title = screen.getByText('Main Title');
    expect(title.tagName).toBe('H1');
    expect(title).toHaveClass('text-5xl', 'md:text-6xl', 'font-bold', 'text-emerald-dark', 'mb-4');
  });

  it('should highlight "electronic signature" text in subtitle', () => {
    renderWithProviders(
      <HeroSection
        title="Title"
        subtitle="Sign with electronic signature today"
      />
    );
    
    const subtitleParts = screen.getByText(/electronic signature/i);
    expect(subtitleParts).toHaveClass('text-blue', 'font-semibold');
  });

  it('should not highlight text when subtitle does not contain "electronic signature"', () => {
    renderWithProviders(
      <HeroSection
        title="Title"
        subtitle="Regular subtitle text"
      />
    );
    
    const subtitle = screen.getByText('Regular subtitle text');
    expect(subtitle).toBeInTheDocument();
  });

  it('should have proper container styling', () => {
    const { container } = renderWithProviders(
      <HeroSection
        title="Title"
        subtitle="Subtitle"
      />
    );
    
    const hero = container.firstChild as HTMLElement;
    expect(hero).toHaveClass('text-center', 'mb-12');
  });

  it('should handle case-insensitive matching for "electronic signature"', () => {
    renderWithProviders(
      <HeroSection
        title="Title"
        subtitle="ELECTRONIC SIGNATURE is available"
      />
    );
    
    const highlightedText = screen.getByText('ELECTRONIC SIGNATURE');
    expect(highlightedText).toHaveClass('text-blue', 'font-semibold');
  });
});














