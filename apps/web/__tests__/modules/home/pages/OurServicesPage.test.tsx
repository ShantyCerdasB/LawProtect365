// @ts-nocheck
/**
 * @fileoverview Our Services Page Component Tests
 * @summary Tests for the OurServicesPage component
 */

import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/__tests__/helpers';
import { OurServicesPage } from '@/modules/home/pages/OurServicesPage';

describe('OurServicesPage', () => {
  it('should render our services page', () => {
    renderWithProviders(<OurServicesPage />);
    
    expect(screen.getByText(/mission/i)).toBeInTheDocument();
  });

  it('should render mission title', () => {
    renderWithProviders(<OurServicesPage />);
    
    const missionTitle = screen.getByText(/mission/i);
    expect(missionTitle).toBeInTheDocument();
  });

  it('should render mission content with highlight', () => {
    renderWithProviders(<OurServicesPage />);
    
    const missionSection = screen.getByText(/mission/i).closest('div');
    expect(missionSection).toBeInTheDocument();
  });

  it('should render image with correct src', () => {
    renderWithProviders(<OurServicesPage />);
    
    const image = screen.getByAltText('Law Protect 365 Services');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', '/OurServicesFirst.jpg');
  });

  it('should render ImageTextSection component', () => {
    const { container } = renderWithProviders(<OurServicesPage />);
    
    const imageTextSection = container.querySelector('.relative');
    expect(imageTextSection).toBeInTheDocument();
  });

  it('should have proper mission title styling', () => {
    renderWithProviders(<OurServicesPage />);
    
    const missionTitle = screen.getByText(/mission/i);
    expect(missionTitle).toHaveClass('text-lg', 'md:text-5xl', 'lg:text-6xl', 'font-bold');
    expect(missionTitle).toHaveClass('text-emerald-dark');
  });

  it('should have proper mission content styling', () => {
    renderWithProviders(<OurServicesPage />);
    
    const missionSection = screen.getByText(/mission/i).closest('div');
    const missionText = missionSection?.querySelector('.text-sm');
    expect(missionText).toHaveClass('md:text-3xl', 'lg:text-4xl');
  });

  it('should render mission lines with proper indentation', () => {
    renderWithProviders(<OurServicesPage />);
    
    const missionSection = screen.getByText(/mission/i).closest('div');
    const indentedLines = missionSection?.querySelectorAll('.pl-4, .pl-6');
    expect(indentedLines?.length).toBeGreaterThan(0);
  });
});














