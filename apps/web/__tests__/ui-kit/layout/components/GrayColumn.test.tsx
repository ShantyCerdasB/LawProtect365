// @ts-nocheck
/**
 * @fileoverview Gray Column Component Tests
 * @summary Tests for the GrayColumn component
 */

import { render } from '@testing-library/react';
import { renderWithProviders } from '@/__tests__/helpers';
import { GrayColumn } from '@/ui-kit/layout/components/GrayColumn';

describe('GrayColumn', () => {
  it('should render gray column with default props', () => {
    const { container } = renderWithProviders(<GrayColumn />);
    
    const column = container.firstChild as HTMLElement;
    expect(column).toBeInTheDocument();
    expect(column).toHaveClass('absolute', 'left-0', 'top-0', 'bottom-0');
  });

  it('should apply default width classes', () => {
    const { container } = renderWithProviders(<GrayColumn />);
    
    const column = container.firstChild as HTMLElement;
    expect(column).toHaveClass('w-1/5', 'md:w-[20%]');
  });

  it('should apply default background color', () => {
    const { container } = renderWithProviders(<GrayColumn />);
    
    const column = container.firstChild as HTMLElement;
    expect(column).toHaveClass('bg-gray-100');
  });

  it('should apply custom width', () => {
    const { container } = renderWithProviders(<GrayColumn width="w-1/4" />);
    
    const column = container.firstChild as HTMLElement;
    expect(column).toHaveClass('w-1/4');
    expect(column).not.toHaveClass('w-1/5');
  });

  it('should apply custom background color', () => {
    const { container } = renderWithProviders(<GrayColumn backgroundColor="bg-gray-200" />);
    
    const column = container.firstChild as HTMLElement;
    expect(column).toHaveClass('bg-gray-200');
    expect(column).not.toHaveClass('bg-gray-100');
  });

  it('should apply custom className', () => {
    const { container } = renderWithProviders(<GrayColumn className="custom-class" />);
    
    const column = container.firstChild as HTMLElement;
    expect(column).toHaveClass('custom-class');
  });

  it('should have z-index class', () => {
    const { container } = renderWithProviders(<GrayColumn />);
    
    const column = container.firstChild as HTMLElement;
    expect(column).toHaveClass('z-0');
  });
});


