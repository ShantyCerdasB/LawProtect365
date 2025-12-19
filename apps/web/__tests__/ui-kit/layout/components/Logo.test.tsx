// @ts-nocheck
/**
 * @fileoverview Logo Component Tests
 * @summary Tests for the Logo component
 */

import { render, screen } from '@testing-library/react';
import { renderWithProviders } from '@/__tests__/helpers';
import { Logo } from '@/ui-kit/layout/components/Logo';

describe('Logo', () => {
  it('should render logo image by default', () => {
    renderWithProviders(<Logo />);
    
    const img = screen.getByAltText('Law Protect 365');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/lawProtectLogo.png');
  });

  it('should render image when useImage is true', () => {
    renderWithProviders(<Logo useImage={true} />);
    
    const img = screen.getByAltText('Law Protect 365');
    expect(img).toBeInTheDocument();
  });

  it('should render text logo when useImage is false', () => {
    renderWithProviders(<Logo useImage={false} />);
    
    expect(screen.getByText('LAW PROTECT')).toBeInTheDocument();
    expect(screen.getByText('365')).toBeInTheDocument();
    expect(screen.queryByAltText('Law Protect 365')).not.toBeInTheDocument();
  });

  it('should apply custom className to image', () => {
    renderWithProviders(<Logo className="custom-logo" />);
    
    const img = screen.getByAltText('Law Protect 365');
    expect(img).toHaveClass('custom-logo');
    expect(img).toHaveClass('h-12', 'md:h-16', 'object-contain');
  });

  it('should apply custom className to text logo', () => {
    const { container } = renderWithProviders(<Logo useImage={false} className="custom-class" />);
    
    const logoDiv = container.firstChild as HTMLElement;
    expect(logoDiv).toHaveClass('custom-class');
  });

  it('should have proper text logo structure', () => {
    const { container } = renderWithProviders(<Logo useImage={false} />);
    
    const logoDiv = container.firstChild as HTMLElement;
    expect(logoDiv).toHaveClass('flex', 'flex-col', 'items-center');
    
    expect(screen.getByText('LAW PROTECT')).toHaveClass('text-white', 'font-semibold', 'text-lg');
    expect(screen.getByText('365')).toHaveClass('text-white', 'font-semibold', 'text-lg');
  });

  it('should render separator line in text logo', () => {
    const { container } = renderWithProviders(<Logo useImage={false} />);
    
    const separator = container.querySelector('.w-full.h-px.bg-white');
    expect(separator).toBeInTheDocument();
  });
});




