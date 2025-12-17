// @ts-nocheck
/**
 * @fileoverview Contact Section Component Tests
 * @summary Tests for the ContactSection component
 */

import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/__tests__/helpers';
import { ContactSection } from '@/ui-kit/layout/components/ContactSection';

describe('ContactSection', () => {
  const mockOffice = {
    name: 'Corporate Office',
    address: '123 Main St\nNew York, NY 10001',
    phone: '+1 (555) 123-4567',
    email: 'corporate@example.com',
  };

  it('should render contact title', () => {
    renderWithProviders(<ContactSection office={mockOffice} />);
    
    expect(screen.getByText(/contact us/i)).toBeInTheDocument();
  });

  it('should render office name', () => {
    renderWithProviders(<ContactSection office={mockOffice} />);
    
    expect(screen.getByText('Corporate Office')).toBeInTheDocument();
  });

  it('should render office address', () => {
    renderWithProviders(<ContactSection office={mockOffice} />);
    
    expect(screen.getByText(/123 Main St/i)).toBeInTheDocument();
    expect(screen.getByText(/New York, NY 10001/i)).toBeInTheDocument();
  });

  it('should render phone link with tel: protocol', () => {
    renderWithProviders(<ContactSection office={mockOffice} />);
    
    const phoneLink = screen.getByRole('link', { name: /\+1 \(555\) 123-4567/i });
    expect(phoneLink).toBeInTheDocument();
    expect(phoneLink).toHaveAttribute('href', 'tel:+1 (555) 123-4567');
  });

  it('should render email link with mailto: protocol', () => {
    renderWithProviders(<ContactSection office={mockOffice} />);
    
    const emailLink = screen.getByRole('link', { name: /corporate@example\.com/i });
    expect(emailLink).toBeInTheDocument();
    expect(emailLink).toHaveAttribute('href', 'mailto:corporate@example.com');
  });

  it('should render location icon', () => {
    const { container } = renderWithProviders(<ContactSection office={mockOffice} />);
    
    const icons = container.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThan(0);
  });

  it('should render phone icon', () => {
    const { container } = renderWithProviders(<ContactSection office={mockOffice} />);
    
    const icons = container.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThan(0);
  });

  it('should render email icon', () => {
    const { container } = renderWithProviders(<ContactSection office={mockOffice} />);
    
    const icons = container.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThan(0);
  });

  it('should have proper link hover styling', () => {
    renderWithProviders(<ContactSection office={mockOffice} />);
    
    const phoneLink = screen.getByRole('link', { name: /\+1 \(555\) 123-4567/i });
    expect(phoneLink).toHaveClass('hover:text-emerald');
    
    const emailLink = screen.getByRole('link', { name: /corporate@example\.com/i });
    expect(emailLink).toHaveClass('hover:text-emerald');
  });

  it('should have proper responsive padding classes', () => {
    const { container } = renderWithProviders(<ContactSection office={mockOffice} />);
    const section = container.querySelector('.pt-0');
    
    expect(section).toBeInTheDocument();
    expect(section).toHaveClass('md:pt-28', 'lg:pt-36');
  });

  it('should preserve line breaks in address', () => {
    renderWithProviders(<ContactSection office={mockOffice} />);
    
    const addressElement = screen.getByText(/123 Main St/i);
    expect(addressElement).toHaveClass('whitespace-pre-line');
  });
});


