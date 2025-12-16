// @ts-nocheck
/**
 * @fileoverview IconButton Component Tests - Test suite for IconButton component
 * @summary Tests IconButton rendering, icons, interactions, and styling
 * @description
 * Tests the IconButton component including icon rendering, children content,
 * click handlers, styling, and accessibility.
 */

/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IconButton } from '@/ui-kit/buttons/IconButton';
import { renderWithProviders, createIconButtonProps } from '@/__tests__/helpers';

describe('IconButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render button with icon', () => {
      const icon = <span data-testid="icon">Icon</span>;
      renderWithProviders(<IconButton icon={icon}>Button</IconButton>);
      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });

    it('should render button with children text', () => {
      renderWithProviders(
        <IconButton icon={<span>Icon</span>}>
          Click me
        </IconButton>
      );
      expect(screen.getByText('Click me')).toBeInTheDocument();
    });

    it('should render button without children', () => {
      renderWithProviders(<IconButton icon={<span>Icon</span>} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      renderWithProviders(
        <IconButton icon={<span>Icon</span>} className="custom-class">
          Button
        </IconButton>
      );
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });
  });

  describe('interactions', () => {
    it('should call onClick when clicked', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();
      renderWithProviders(
        <IconButton icon={<span>Icon</span>} onClick={handleClick}>
          Button
        </IconButton>
      );

      await user.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when disabled', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();
      renderWithProviders(
        <IconButton icon={<span>Icon</span>} onClick={handleClick} disabled>
          Button
        </IconButton>
      );

      await user.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('styling', () => {
    it('should have default styling classes', () => {
      renderWithProviders(<IconButton icon={<span>Icon</span>}>Button</IconButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('p-2', 'rounded', 'inline-flex', 'items-center', 'gap-2');
    });

    it('should apply custom styles', () => {
      renderWithProviders(
        <IconButton icon={<span>Icon</span>} style={{ color: 'red' }}>
          Button
        </IconButton>
      );
      const button = screen.getByRole('button');
      expect(button).toHaveStyle({ color: 'red' });
    });
  });

  describe('accessibility', () => {
    it('should support aria-label', () => {
      renderWithProviders(
        <IconButton icon={<span>Icon</span>} aria-label="Close">
          Button
        </IconButton>
      );
      expect(screen.getByLabelText('Close')).toBeInTheDocument();
    });

    it('should support aria-disabled', () => {
      renderWithProviders(
        <IconButton icon={<span>Icon</span>} aria-disabled="true">
          Button
        </IconButton>
      );
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });
  });

  describe('edge cases', () => {
    it('should handle empty icon', () => {
      renderWithProviders(<IconButton icon={<></>}>Button</IconButton>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should handle null icon', () => {
      renderWithProviders(<IconButton icon={null as any}>Button</IconButton>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should handle multiple className values', () => {
      renderWithProviders(
        <IconButton icon={<span>Icon</span>} className="class1 class2">
          Button
        </IconButton>
      );
      const button = screen.getByRole('button');
      expect(button).toHaveClass('class1', 'class2');
    });
  });
});
