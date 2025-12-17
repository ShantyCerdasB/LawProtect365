// @ts-nocheck
/**
 * @fileoverview Gray Separator Component Tests
 * @summary Tests for the GraySeparator component
 */

import { render } from '@testing-library/react';
import { renderWithProviders } from '@/__tests__/helpers';
import { GraySeparator } from '@/ui-kit/layout/components/GraySeparator';

describe('GraySeparator', () => {
  it('should render gray separator', () => {
    const { container } = renderWithProviders(<GraySeparator />);
    
    const separator = container.firstChild as HTMLElement;
    expect(separator).toBeInTheDocument();
    expect(separator).toHaveClass('w-full');
  });

  it('should apply default height classes', () => {
    const { container } = renderWithProviders(<GraySeparator />);
    
    const separator = container.firstChild as HTMLElement;
    expect(separator).toHaveClass('h-16', 'md:h-24', 'lg:h-32');
  });

  it('should apply default background color', () => {
    const { container } = renderWithProviders(<GraySeparator />);
    
    const separator = container.firstChild as HTMLElement;
    expect(separator).toHaveClass('bg-gray-100');
  });

  it('should apply custom height', () => {
    const { container } = renderWithProviders(<GraySeparator height="h-20" />);
    
    const separator = container.firstChild as HTMLElement;
    expect(separator).toHaveClass('h-20');
    expect(separator).not.toHaveClass('h-16');
  });

  it('should apply custom background color', () => {
    const { container } = renderWithProviders(<GraySeparator backgroundColor="bg-gray-200" />);
    
    const separator = container.firstChild as HTMLElement;
    expect(separator).toHaveClass('bg-gray-200');
    expect(separator).not.toHaveClass('bg-gray-100');
  });

  it('should apply custom className', () => {
    const { container } = renderWithProviders(<GraySeparator className="custom-class" />);
    
    const separator = container.firstChild as HTMLElement;
    expect(separator).toHaveClass('custom-class');
  });
});


