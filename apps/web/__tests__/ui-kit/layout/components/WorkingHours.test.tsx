// @ts-nocheck
/**
 * @fileoverview Working Hours Component Tests
 * @summary Tests for the WorkingHours component
 */

import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/__tests__/helpers';
import { WorkingHours } from '@/ui-kit/layout/components/WorkingHours';

describe('WorkingHours', () => {
  const mockSchedule = 'Monday - Friday: 9:00 AM - 5:00 PM\nSaturday: 10:00 AM - 2:00 PM\nSunday: Closed';

  it('should render working hours title', () => {
    renderWithProviders(<WorkingHours schedule={mockSchedule} />);
    
    expect(screen.getByText(/working hours/i)).toBeInTheDocument();
  });

  it('should render schedule text', () => {
    renderWithProviders(<WorkingHours schedule={mockSchedule} />);
    
    expect(screen.getByText(/Monday - Friday/i)).toBeInTheDocument();
    expect(screen.getByText(/9:00 AM - 5:00 PM/i)).toBeInTheDocument();
  });

  it('should render all schedule lines', () => {
    renderWithProviders(<WorkingHours schedule={mockSchedule} />);
    
    expect(screen.getByText(/Saturday/i)).toBeInTheDocument();
    expect(screen.getByText(/Sunday: Closed/i)).toBeInTheDocument();
  });

  it('should have proper title styling', () => {
    renderWithProviders(<WorkingHours schedule={mockSchedule} />);
    
    const title = screen.getByText(/working hours/i);
    expect(title).toHaveClass('text-white', 'font-bold', 'text-lg', 'mb-4');
  });

  it('should have proper schedule text styling', () => {
    renderWithProviders(<WorkingHours schedule={mockSchedule} />);
    
    const scheduleText = screen.getByText(/Monday - Friday/i).closest('p');
    expect(scheduleText).toHaveClass('text-white', 'text-sm', 'md:text-base');
  });

  it('should have proper responsive padding classes', () => {
    const { container } = renderWithProviders(<WorkingHours schedule={mockSchedule} />);
    const section = container.querySelector('.pt-0');
    
    expect(section).toBeInTheDocument();
    expect(section).toHaveClass('md:pt-28', 'lg:pt-36');
  });

  it('should render empty schedule', () => {
    renderWithProviders(<WorkingHours schedule="" />);
    
    expect(screen.getByText(/working hours/i)).toBeInTheDocument();
    const scheduleParagraph = screen.getByText(/working hours/i).nextElementSibling;
    expect(scheduleParagraph).toBeInTheDocument();
    expect(scheduleParagraph?.textContent).toBe('');
  });

  it('should render single line schedule', () => {
    const singleLineSchedule = 'Monday - Friday: 9:00 AM - 5:00 PM';
    renderWithProviders(<WorkingHours schedule={singleLineSchedule} />);
    
    expect(screen.getByText(singleLineSchedule)).toBeInTheDocument();
  });
});



