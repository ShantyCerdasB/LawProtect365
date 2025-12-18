// @ts-nocheck
/**
 * @fileoverview SpinnerOverlay Component Tests
 * @summary Tests for the SpinnerOverlay component
 */

import { render } from '@testing-library/react';
import { renderWithProviders } from '@/__tests__/helpers';
import { SpinnerOverlay } from '@ui-kit/feedback/SpinnerOverlay';

describe('SpinnerOverlay', () => {
  it('should render spinner overlay', () => {
    const { container } = renderWithProviders(<SpinnerOverlay />);
    
    const overlay = container.firstChild as HTMLElement;
    expect(overlay).toBeInTheDocument();
  });

  it('should have fixed positioning classes', () => {
    const { container } = renderWithProviders(<SpinnerOverlay />);
    const overlay = container.firstChild as HTMLElement;
    
    expect(overlay).toHaveClass('fixed', 'inset-0');
  });

  it('should render spinner element', () => {
    const { container } = renderWithProviders(<SpinnerOverlay />);
    const spinner = container.querySelector('.animate-spin');
    
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('rounded-full', 'h-10', 'w-10');
  });
});



