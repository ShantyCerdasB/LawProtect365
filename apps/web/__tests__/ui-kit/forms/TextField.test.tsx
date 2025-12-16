// @ts-nocheck
/**
 * @fileoverview TextField Component Tests - Test suite for TextField component
 * @summary Tests TextField rendering, labels, help text, interactions, and validation
 * @description
 * Tests the TextField component including label rendering, help text, input interactions,
 * value changes, placeholder, disabled state, and accessibility.
 */

/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TextField } from '@/ui-kit/forms/TextField';
import { renderWithProviders, createTextFieldProps } from '@/__tests__/helpers';

describe('TextField', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render input field', () => {
      renderWithProviders(<TextField name="test" />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should render label when provided', () => {
      renderWithProviders(<TextField label="Email" name="email" />);
      expect(screen.getByText('Email')).toBeInTheDocument();
    });

    it('should not render label when not provided', () => {
      renderWithProviders(<TextField name="test" />);
      const label = screen.queryByText('Email');
      expect(label).not.toBeInTheDocument();
    });

    it('should render help text when provided', () => {
      renderWithProviders(
        <TextField name="test" label="Email" helpText="Enter your email address" />
      );
      expect(screen.getByText('Enter your email address')).toBeInTheDocument();
    });

    it('should not render help text when not provided', () => {
      renderWithProviders(<TextField name="test" label="Email" />);
      const helpText = screen.queryByText('Enter your email address');
      expect(helpText).not.toBeInTheDocument();
    });

    it('should apply custom className', () => {
      renderWithProviders(<TextField name="test" className="custom-class" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('custom-class');
    });
  });

  describe('value and placeholder', () => {
    it('should display initial value', () => {
      renderWithProviders(<TextField name="test" value="test value" />);
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.value).toBe('test value');
    });

    it('should display placeholder', () => {
      renderWithProviders(<TextField name="test" placeholder="Enter text" />);
      const input = screen.getByPlaceholderText('Enter text');
      expect(input).toBeInTheDocument();
    });

    it('should handle empty value', () => {
      renderWithProviders(<TextField name="test" value="" />);
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.value).toBe('');
    });
  });

  describe('interactions', () => {
    it('should call onChange when value changes', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();
      renderWithProviders(<TextField name="test" onChange={handleChange} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'test');
      expect(handleChange).toHaveBeenCalled();
    });

    it('should update value on user input', async () => {
      const user = userEvent.setup();
      renderWithProviders(<TextField name="test" />);

      const input = screen.getByRole('textbox') as HTMLInputElement;
      await user.type(input, 'new value');
      expect(input.value).toBe('new value');
    });

    it('should not call onChange when disabled', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();
      renderWithProviders(
        <TextField name="test" onChange={handleChange} disabled />
      );

      const input = screen.getByRole('textbox');
      await user.type(input, 'test');
      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe('input types', () => {
    it('should render email input type', () => {
      renderWithProviders(<TextField name="email" type="email" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'email');
    });

    it('should render password input type', () => {
      renderWithProviders(<TextField name="password" type="password" />);
      const input = document.querySelector('input[name="password"]') as HTMLInputElement;
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'password');
    });

    it('should render number input type', () => {
      renderWithProviders(<TextField name="number" type="number" />);
      const input = screen.getByRole('spinbutton');
      expect(input).toHaveAttribute('type', 'number');
    });
  });

  describe('validation states', () => {
    it('should support required attribute', () => {
      renderWithProviders(<TextField name="test" required />);
      const input = screen.getByRole('textbox');
      expect(input).toBeRequired();
    });

    it('should support minLength attribute', () => {
      renderWithProviders(<TextField name="test" minLength={5} />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('minLength', '5');
    });

    it('should support maxLength attribute', () => {
      renderWithProviders(<TextField name="test" maxLength={100} />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('maxLength', '100');
    });

    it('should support pattern attribute', () => {
      renderWithProviders(<TextField name="test" pattern="[0-9]*" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('pattern', '[0-9]*');
    });
  });

  describe('accessibility', () => {
    it('should associate label with input', () => {
      renderWithProviders(<TextField name="email" label="Email" />);
      const input = screen.getByLabelText('Email');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('name', 'email');
    });

    it('should support aria-label', () => {
      renderWithProviders(<TextField name="test" aria-label="Email address" />);
      expect(screen.getByLabelText('Email address')).toBeInTheDocument();
    });

    it('should support aria-describedby for help text', () => {
      renderWithProviders(
        <TextField name="test" label="Email" helpText="Required field" />
      );
      const input = document.querySelector('input[name="test"]') as HTMLInputElement;
      const helpText = screen.getByText('Required field');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('aria-describedby');
      expect(helpText).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle null value', () => {
      renderWithProviders(<TextField name="test" value={null as any} />);
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
    });

    it('should handle undefined value', () => {
      renderWithProviders(<TextField name="test" value={undefined} />);
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
    });

    it('should handle empty string label', () => {
      renderWithProviders(<TextField name="test" label="" />);
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
    });
  });
});
