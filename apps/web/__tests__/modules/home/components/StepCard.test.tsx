// @ts-nocheck
/**
 * @fileoverview Step Card Component Tests
 * @summary Tests for the StepCard component
 */

import { render, screen } from '@testing-library/react';
import { renderWithProviders } from '@/__tests__/helpers';
import { StepCard } from '@app/modules/home/components/StepCard';

describe('StepCard', () => {
  const mockIcon = <div data-testid="step-icon">Icon</div>;

  it('should render step card with icon, title and description', () => {
    renderWithProviders(
      <StepCard
        icon={mockIcon}
        title="Step Title"
        description="Step description"
      />
    );
    
    expect(screen.getByTestId('step-icon')).toBeInTheDocument();
    expect(screen.getByText('Step Title')).toBeInTheDocument();
    expect(screen.getByText('Step description')).toBeInTheDocument();
  });

  it('should render title as h3', () => {
    renderWithProviders(
      <StepCard
        icon={mockIcon}
        title="Step Title"
        description="Description"
      />
    );
    
    const title = screen.getByText('Step Title');
    expect(title.tagName).toBe('H3');
    expect(title).toHaveClass('text-xl', 'font-semibold', 'text-blue', 'mb-3');
  });

  it('should render description as paragraph', () => {
    renderWithProviders(
      <StepCard
        icon={mockIcon}
        title="Title"
        description="Step description"
      />
    );
    
    const description = screen.getByText('Step description');
    expect(description.tagName).toBe('P');
    expect(description).toHaveClass('text-base', 'text-blue', 'leading-relaxed');
  });

  it('should have proper container styling', () => {
    const { container } = renderWithProviders(
      <StepCard
        icon={mockIcon}
        title="Title"
        description="Description"
      />
    );
    
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('flex', 'flex-col', 'items-center', 'text-center', 'max-w-sm');
  });

  it('should render icon in container', () => {
    const { container } = renderWithProviders(
      <StepCard
        icon={mockIcon}
        title="Title"
        description="Description"
      />
    );
    
    const iconContainer = container.querySelector('.mb-6');
    expect(iconContainer).toBeInTheDocument();
    expect(screen.getByTestId('step-icon')).toBeInTheDocument();
  });

  it('should handle different icon types', () => {
    const svgIcon = <svg data-testid="svg-icon"><path /></svg>;
    
    const { rerender } = renderWithProviders(
      <StepCard
        icon={mockIcon}
        title="Title"
        description="Description"
      />
    );
    
    expect(screen.getByTestId('step-icon')).toBeInTheDocument();
    
    rerender(
      <StepCard
        icon={svgIcon}
        title="Title"
        description="Description"
      />
    );
    
    expect(screen.getByTestId('svg-icon')).toBeInTheDocument();
  });
});














