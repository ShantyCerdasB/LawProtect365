// @ts-nocheck
/**
 * @fileoverview Toast Component Tests
 * @summary Tests for the Toast component
 */

import { render, screen } from '@testing-library/react';
import { renderWithProviders } from '@/__tests__/helpers';
import { Toast } from '@ui-kit/feedback/Toast';

describe('Toast', () => {
  it('should render toast with message', () => {
    renderWithProviders(<Toast message="Test toast message" />);
    
    expect(screen.getByText('Test toast message')).toBeInTheDocument();
  });

  it('should have fixed positioning classes', () => {
    const { container } = renderWithProviders(<Toast message="Test" />);
    const toast = container.firstChild as HTMLElement;
    
    expect(toast).toHaveClass('fixed', 'bottom-4', 'right-4');
  });

  it('should have proper styling classes', () => {
    const { container } = renderWithProviders(<Toast message="Test" />);
    const toast = container.firstChild as HTMLElement;
    
    expect(toast).toHaveClass('bg-gray-900', 'text-white', 'px-4', 'py-2', 'rounded');
  });

  it('should render different messages', () => {
    const { rerender } = renderWithProviders(<Toast message="First message" />);
    expect(screen.getByText('First message')).toBeInTheDocument();

    rerender(<Toast message="Second message" />);
    expect(screen.getByText('Second message')).toBeInTheDocument();
    expect(screen.queryByText('First message')).not.toBeInTheDocument();
  });
});














