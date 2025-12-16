// @ts-nocheck
/**
 * @fileoverview Select Component Tests - Test suite for Select component
 * @summary Tests Select rendering, options, interactions, and validation
 * @description
 * Tests the Select component including label rendering, options rendering,
 * value selection, onChange handling, disabled state, and accessibility.
 */

/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Select } from '@/ui-kit/forms/Select';
import { renderWithProviders, createSelectProps } from '@/__tests__/helpers';

describe('Select', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render select element', () => {
      renderWithProviders(<Select name="test" value="" onChange={() => {}} />);
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('should render label when provided', () => {
      renderWithProviders(<Select label="Country" name="country" value="" onChange={() => {}} />);
      expect(screen.getByText('Country')).toBeInTheDocument();
    });

    it('should not render label when not provided', () => {
      renderWithProviders(<Select name="test" value="" onChange={() => {}} />);
      const label = screen.queryByText('Country');
      expect(label).not.toBeInTheDocument();
    });

    it('should apply custom className', () => {
      renderWithProviders(<Select name="test" className="custom-class" value="" onChange={() => {}} />);
      const select = screen.getByRole('combobox');
      expect(select).toHaveClass('custom-class');
    });
  });

  describe('options', () => {
    it('should render options when provided', () => {
      const options = [
        { value: 'option1', label: 'Option 1' },
        { value: 'option2', label: 'Option 2' },
      ];
      renderWithProviders(<Select name="test" options={options} value="" onChange={() => {}} />);
      expect(screen.getByText('Option 1')).toBeInTheDocument();
      expect(screen.getByText('Option 2')).toBeInTheDocument();
    });

    it('should render empty select when no options provided', () => {
      renderWithProviders(<Select name="test" options={[]} value="" onChange={() => {}} />);
      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
      expect(select.children.length).toBe(0);
    });

    it('should render empty select when options not provided', () => {
      renderWithProviders(<Select name="test" value="" onChange={() => {}} />);
      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
    });

    it('should set option values correctly', () => {
      const options = [
        { value: 'val1', label: 'Label 1' },
        { value: 'val2', label: 'Label 2' },
      ];
      renderWithProviders(<Select name="test" options={options} value="" onChange={() => {}} />);
      const select = screen.getByRole('combobox') as HTMLSelectElement;
      const option1 = select.options[0];
      const option2 = select.options[1];
      expect(option1.value).toBe('val1');
      expect(option2.value).toBe('val2');
    });
  });

  describe('value selection', () => {
    it('should display selected value', () => {
      const options = [
        { value: 'option1', label: 'Option 1' },
        { value: 'option2', label: 'Option 2' },
      ];
      renderWithProviders(
        <Select name="test" options={options} value="option2" onChange={() => {}} />
      );
      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe('option2');
    });

    it('should handle empty value', () => {
      const options = [
        { value: 'option1', label: 'Option 1' },
        { value: 'option2', label: 'Option 2' },
      ];
      renderWithProviders(<Select name="test" options={options} value="" onChange={() => {}} />);
      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe('option1');
    });
  });

  describe('interactions', () => {
    it('should call onChange when option is selected', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();
      const options = [
        { value: 'option1', label: 'Option 1' },
        { value: 'option2', label: 'Option 2' },
      ];
      renderWithProviders(
        <Select name="test" options={options} onChange={handleChange} />
      );

      const select = screen.getByRole('combobox');
      await user.selectOptions(select, 'option2');
      expect(handleChange).toHaveBeenCalled();
    });

    it('should update value on selection', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();
      const options = [
        { value: 'option1', label: 'Option 1' },
        { value: 'option2', label: 'Option 2' },
      ];
      const { rerender } = renderWithProviders(
        <Select name="test" options={options} value="option1" onChange={handleChange} />
      );

      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe('option1');
      
      await user.selectOptions(select, 'option2');
      expect(handleChange).toHaveBeenCalled();
      
      rerender(<Select name="test" options={options} value="option2" onChange={handleChange} />);
      expect(select.value).toBe('option2');
    });

    it('should not call onChange when disabled', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();
      const options = [
        { value: 'option1', label: 'Option 1' },
        { value: 'option2', label: 'Option 2' },
      ];
      renderWithProviders(
        <Select name="test" options={options} onChange={handleChange} disabled />
      );

      const select = screen.getByRole('combobox');
      await user.selectOptions(select, 'option2');
      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe('validation states', () => {
    it('should support required attribute', () => {
      renderWithProviders(<Select name="test" required />);
      const select = screen.getByRole('combobox');
      expect(select).toBeRequired();
    });

    it('should support multiple attribute', () => {
      const options = [
        { value: 'option1', label: 'Option 1' },
        { value: 'option2', label: 'Option 2' },
      ];
      renderWithProviders(<Select name="test" options={options} multiple value={[]} onChange={() => {}} />);
      const select = screen.getByRole('listbox');
      expect(select).toHaveAttribute('multiple');
    });
  });

  describe('accessibility', () => {
    it('should associate label with select', () => {
      renderWithProviders(<Select name="country" label="Country" value="" onChange={() => {}} />);
      const select = screen.getByLabelText('Country');
      expect(select).toBeInTheDocument();
      expect(select).toHaveAttribute('name', 'country');
    });

    it('should support aria-label', () => {
      renderWithProviders(<Select name="test" aria-label="Select country" value="" onChange={() => {}} />);
      expect(screen.getByLabelText('Select country')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle options with duplicate values', () => {
      const options = [
        { value: 'dup', label: 'Option 1' },
        { value: 'dup', label: 'Option 2' },
      ];
      renderWithProviders(<Select name="test" options={options} value="" onChange={() => {}} />);
      const select = screen.getByRole('combobox');
      expect(select.children.length).toBe(2);
    });

    it('should handle options with empty values', () => {
      const options = [
        { value: '', label: 'None' },
        { value: 'option1', label: 'Option 1' },
      ];
      renderWithProviders(<Select name="test" options={options} value="" onChange={() => {}} />);
      const select = screen.getByRole('combobox');
      expect(select.children.length).toBe(2);
    });

    it('should handle options with empty labels', () => {
      const options = [
        { value: 'option1', label: '' },
        { value: 'option2', label: 'Option 2' },
      ];
      renderWithProviders(<Select name="test" options={options} value="" onChange={() => {}} />);
      const select = screen.getByRole('combobox');
      expect(select.children.length).toBe(2);
    });
  });
});
