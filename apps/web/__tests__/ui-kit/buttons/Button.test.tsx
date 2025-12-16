// @ts-nocheck
/**
 * @fileoverview Button Component Tests - Comprehensive test suite for Button component
 * @summary Tests all Button variants, sizes, interactions, and edge cases
 * @description
 * Tests the Button component including all variants (primary, secondary, outline, emerald),
 * all sizes (sm, md, lg), custom styling, disabled state, click handlers, and accessibility.
 */

/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@/ui-kit/buttons/Button';
import { renderWithProviders, createButtonProps } from '@/__tests__/helpers';

describe('Button', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render button with children text', () => {
      renderWithProviders(<Button>Click me</Button>);
      expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
    });

    it('should render button with custom className', () => {
      renderWithProviders(<Button className="custom-class">Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });

    it('should render as disabled when disabled prop is true', () => {
      renderWithProviders(<Button disabled>Disabled Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should render button with aria-label when provided', () => {
      renderWithProviders(<Button aria-label="Submit form">Submit</Button>);
      expect(screen.getByLabelText('Submit form')).toBeInTheDocument();
    });
  });

  describe('variants', () => {
    it('should render primary variant by default', () => {
      renderWithProviders(<Button>Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-white', 'border-transparent');
      expect(button).toHaveStyle({ backgroundColor: '#1d4878' });
    });

    it('should render outline variant as secondary style', () => {
      renderWithProviders(<Button variant="outline">Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-transparent', 'border-white');
    });

    it('should render outline variant', () => {
      renderWithProviders(<Button variant="outline">Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-transparent', 'border-white');
    });

    it('should render emerald-primary variant', () => {
      renderWithProviders(<Button variant="emerald-primary">Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-white', 'border-transparent');
      expect(button).toHaveStyle({ backgroundColor: '#12626d' });
    });

    it('should render emerald-outline variant', () => {
      renderWithProviders(<Button variant="emerald-outline">Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-transparent');
    });
  });

  describe('sizes', () => {
    it('should render medium size by default', () => {
      renderWithProviders(<Button>Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-10', 'py-1.5');
    });

    it('should render small size', () => {
      renderWithProviders(<Button size="sm">Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-6', 'py-1');
    });

    it('should render large size', () => {
      renderWithProviders(<Button size="lg">Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-12', 'py-2');
    });
  });

  describe('custom styling', () => {
    it('should apply custom backgroundColor', () => {
      renderWithProviders(<Button bgColor="#ff0000">Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveStyle({ backgroundColor: '#ff0000' });
    });

    it('should apply custom textColor', () => {
      renderWithProviders(<Button textColor="#00ff00">Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveStyle({ color: '#00ff00' });
    });

    it('should apply custom borderColor', () => {
      renderWithProviders(<Button borderColor="#0000ff">Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveStyle({ '--border-color': '#0000ff' });
    });

    it('should apply custom hoverBgColor for primary variant', () => {
      renderWithProviders(<Button variant="primary" hoverBgColor="#ff00ff">Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveStyle({ '--hover-bg': '#ff00ff' });
    });

    it('should apply custom hoverTextColor for primary variant', () => {
      renderWithProviders(<Button variant="primary" hoverTextColor="#ffff00">Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveStyle({ '--hover-text': '#ffff00' });
    });
  });

  describe('interactions', () => {
    it('should call onClick when button is clicked', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();
      renderWithProviders(<Button onClick={handleClick}>Click me</Button>);

      await user.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when button is disabled', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();
      renderWithProviders(
        <Button onClick={handleClick} disabled>
          Disabled
        </Button>
      );

      await user.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should handle keyboard events', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();
      renderWithProviders(<Button onClick={handleClick}>Button</Button>);

      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('edge cases', () => {
    it('should handle empty children', () => {
      renderWithProviders(<Button />);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should handle null children', () => {
      renderWithProviders(<Button>{null}</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should handle multiple className values', () => {
      renderWithProviders(<Button className="class1 class2 class3">Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('class1', 'class2', 'class3');
    });

    it('should apply all standard button attributes', () => {
      renderWithProviders(
        <Button type="submit" form="test-form" name="test-button" value="test-value">
          Submit
        </Button>
      );
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'submit');
      expect(button).toHaveAttribute('form', 'test-form');
      expect(button).toHaveAttribute('name', 'test-button');
      expect(button).toHaveAttribute('value', 'test-value');
    });
  });

  describe('accessibility', () => {
    it('should have button role by default', () => {
      renderWithProviders(<Button>Button</Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should support aria-disabled attribute', () => {
      renderWithProviders(<Button aria-disabled="true">Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    it('should support aria-label for screen readers', () => {
      renderWithProviders(<Button aria-label="Close dialog">×</Button>);
      expect(screen.getByLabelText('Close dialog')).toBeInTheDocument();
    });
  });
});
