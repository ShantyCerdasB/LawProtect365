// @ts-nocheck
/**
 * @fileoverview IconWrapper Component Tests
 * @summary Tests for the IconWrapper component
 */

import { render, screen } from '@testing-library/react';
import { renderWithProviders } from '@/__tests__/helpers';
import { IconWrapper } from '@/ui-kit/icons/IconWrapper';

describe('IconWrapper', () => {
  const mockIcon = <svg data-testid="test-icon"><path d="M0 0" /></svg>;

  it('should render icon wrapper with icon', () => {
    renderWithProviders(<IconWrapper icon={mockIcon} />);
    
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  it('should apply default size of 106px', () => {
    const { container } = renderWithProviders(<IconWrapper icon={mockIcon} />);
    
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveStyle({ width: '106px', height: '106px' });
  });

  it('should apply custom size', () => {
    const { container } = renderWithProviders(<IconWrapper icon={mockIcon} size={50} />);
    
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveStyle({ width: '50px', height: '50px' });
  });

  it('should apply custom className', () => {
    const { container } = renderWithProviders(
      <IconWrapper icon={mockIcon} className="custom-class" />
    );
    
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('custom-class');
  });

  it('should have flex centering classes', () => {
    const { container } = renderWithProviders(<IconWrapper icon={mockIcon} />);
    
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('flex', 'items-center', 'justify-center');
  });

  it('should render icon inside relative container', () => {
    const { container } = renderWithProviders(<IconWrapper icon={mockIcon} />);
    
    const innerDiv = container.querySelector('.relative');
    expect(innerDiv).toBeInTheDocument();
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  it('should handle different icon types', () => {
    const imgIcon = <img src="test.jpg" alt="test" data-testid="img-icon" />;
    const { rerender } = renderWithProviders(<IconWrapper icon={mockIcon} />);
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();

    rerender(<IconWrapper icon={imgIcon} />);
    expect(screen.getByTestId('img-icon')).toBeInTheDocument();
  });
});

