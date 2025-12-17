// @ts-nocheck
/**
 * @fileoverview Contact Info Component Tests
 * @summary Tests for the ContactInfo component
 */

import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/__tests__/helpers';
import { ContactInfo } from '@/ui-kit/layout/components/ContactInfo';

describe('ContactInfo', () => {
  const mockOffices = [
    {
      name: 'Corporate Office',
      address: '123 Main St\nNew York, NY 10001',
      phone: '+1 (555) 123-4567',
      email: 'corporate@example.com',
    },
    {
      name: 'Beverly Hills Office',
      address: '456 Rodeo Dr\nBeverly Hills, CA 90210',
      phone: '+1 (555) 987-6543',
      email: 'beverlyhills@example.com',
    },
  ];

  it('should render contact title', () => {
    renderWithProviders(<ContactInfo offices={mockOffices} />);
    
    expect(screen.getByText(/contact us/i)).toBeInTheDocument();
  });

  it('should render all office names', () => {
    renderWithProviders(<ContactInfo offices={mockOffices} />);
    
    expect(screen.getByText('Corporate Office')).toBeInTheDocument();
    expect(screen.getByText('Beverly Hills Office')).toBeInTheDocument();
  });

  it('should render office addresses', () => {
    renderWithProviders(<ContactInfo offices={mockOffices} />);
    
    expect(screen.getByText(/123 Main St/i)).toBeInTheDocument();
    expect(screen.getByText(/456 Rodeo Dr/i)).toBeInTheDocument();
  });

  it('should render phone links with tel: protocol', () => {
    renderWithProviders(<ContactInfo offices={mockOffices} />);
    
    const phoneLinks = screen.getAllByRole('link');
    const telLinks = phoneLinks.filter((link) => link.getAttribute('href')?.startsWith('tel:'));
    
    expect(telLinks).toHaveLength(2);
    expect(telLinks[0]).toHaveAttribute('href', 'tel:+1 (555) 123-4567');
    expect(telLinks[1]).toHaveAttribute('href', 'tel:+1 (555) 987-6543');
  });

  it('should render email links with mailto: protocol', () => {
    renderWithProviders(<ContactInfo offices={mockOffices} />);
    
    const emailLinks = screen.getAllByRole('link');
    const mailtoLinks = emailLinks.filter((link) => link.getAttribute('href')?.startsWith('mailto:'));
    
    expect(mailtoLinks).toHaveLength(2);
    expect(mailtoLinks[0]).toHaveAttribute('href', 'mailto:corporate@example.com');
    expect(mailtoLinks[1]).toHaveAttribute('href', 'mailto:beverlyhills@example.com');
  });

  it('should render location icons for each office', () => {
    const { container } = renderWithProviders(<ContactInfo offices={mockOffices} />);
    
    const locationIcons = container.querySelectorAll('svg');
    expect(locationIcons.length).toBeGreaterThan(0);
  });

  it('should render phone icons for each office', () => {
    const { container } = renderWithProviders(<ContactInfo offices={mockOffices} />);
    
    const phoneIcons = container.querySelectorAll('svg');
    expect(phoneIcons.length).toBeGreaterThan(0);
  });

  it('should render email icons for each office', () => {
    const { container } = renderWithProviders(<ContactInfo offices={mockOffices} />);
    
    const emailIcons = container.querySelectorAll('svg');
    expect(emailIcons.length).toBeGreaterThan(0);
  });

  it('should have proper link hover styling', () => {
    renderWithProviders(<ContactInfo offices={mockOffices} />);
    
    const phoneLinks = screen.getAllByRole('link');
    const firstPhoneLink = phoneLinks.find((link) => link.getAttribute('href')?.startsWith('tel:'));
    
    expect(firstPhoneLink).toHaveClass('hover:text-emerald');
  });

  it('should render single office when only one provided', () => {
    renderWithProviders(<ContactInfo offices={[mockOffices[0]]} />);
    
    expect(screen.getByText('Corporate Office')).toBeInTheDocument();
    expect(screen.queryByText('Beverly Hills Office')).not.toBeInTheDocument();
  });

  it('should render empty state when no offices provided', () => {
    renderWithProviders(<ContactInfo offices={[]} />);
    
    expect(screen.getByText(/contact us/i)).toBeInTheDocument();
    expect(screen.queryAllByRole('link')).toHaveLength(0);
  });
});


