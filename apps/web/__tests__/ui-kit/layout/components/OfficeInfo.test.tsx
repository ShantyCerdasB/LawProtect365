// @ts-nocheck
/**
 * @fileoverview Office Info Component Tests
 * @summary Tests for the OfficeInfo component
 */

import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/__tests__/helpers';
import { OfficeInfo } from '@/ui-kit/layout/components/OfficeInfo';

describe('OfficeInfo', () => {
  const mockOffice = {
    name: 'Beverly Hills Office',
    address: '456 Rodeo Dr\nBeverly Hills, CA 90210',
    phone: '+1 (555) 987-6543',
    email: 'beverlyhills@example.com',
  };

  it('should render office name', () => {
    renderWithProviders(<OfficeInfo office={mockOffice} />);
    
    expect(screen.getByText('Beverly Hills Office')).toBeInTheDocument();
  });

  it('should render office address', () => {
    renderWithProviders(<OfficeInfo office={mockOffice} />);
    
    expect(screen.getByText(/456 Rodeo Dr/i)).toBeInTheDocument();
    expect(screen.getByText(/Beverly Hills, CA 90210/i)).toBeInTheDocument();
  });

  it('should render phone link with tel: protocol', () => {
    renderWithProviders(<OfficeInfo office={mockOffice} />);
    
    const phoneLink = screen.getByRole('link', { name: /\+1 \(555\) 987-6543/i });
    expect(phoneLink).toBeInTheDocument();
    expect(phoneLink).toHaveAttribute('href', 'tel:+1 (555) 987-6543');
  });

  it('should render email link with mailto: protocol', () => {
    renderWithProviders(<OfficeInfo office={mockOffice} />);
    
    const emailLink = screen.getByRole('link', { name: /beverlyhills@example\.com/i });
    expect(emailLink).toBeInTheDocument();
    expect(emailLink).toHaveAttribute('href', 'mailto:beverlyhills@example.com');
  });

  it('should render location icon', () => {
    const { container } = renderWithProviders(<OfficeInfo office={mockOffice} />);
    
    const icons = container.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThan(0);
  });

  it('should render phone icon', () => {
    const { container } = renderWithProviders(<OfficeInfo office={mockOffice} />);
    
    const icons = container.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThan(0);
  });

  it('should render email icon', () => {
    const { container } = renderWithProviders(<OfficeInfo office={mockOffice} />);
    
    const icons = container.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThan(0);
  });

  it('should have proper link hover styling', () => {
    renderWithProviders(<OfficeInfo office={mockOffice} />);
    
    const phoneLink = screen.getByRole('link', { name: /\+1 \(555\) 987-6543/i });
    expect(phoneLink).toHaveClass('hover:text-emerald');
    
    const emailLink = screen.getByRole('link', { name: /beverlyhills@example\.com/i });
    expect(emailLink).toHaveClass('hover:text-emerald');
  });

  it('should have proper responsive padding classes', () => {
    const { container } = renderWithProviders(<OfficeInfo office={mockOffice} />);
    const section = container.querySelector('.pt-0');
    
    expect(section).toBeInTheDocument();
    expect(section).toHaveClass('md:pt-28', 'lg:pt-36');
  });

  it('should have spacer div for alignment', () => {
    const { container } = renderWithProviders(<OfficeInfo office={mockOffice} />);
    const spacer = container.querySelector('.h-7.mb-4');
    
    expect(spacer).toBeInTheDocument();
  });

  it('should preserve line breaks in address', () => {
    renderWithProviders(<OfficeInfo office={mockOffice} />);
    
    const addressElement = screen.getByText(/456 Rodeo Dr/i);
    expect(addressElement).toHaveClass('whitespace-pre-line');
  });

  it('should have proper text styling', () => {
    renderWithProviders(<OfficeInfo office={mockOffice} />);
    
    const nameElement = screen.getByText('Beverly Hills Office');
    expect(nameElement).toHaveClass('text-white', 'text-sm', 'md:text-base');
  });
});


