// @ts-nocheck
/**
 * @fileoverview Date Input Modal Component Tests
 * @summary Tests for the DateInputModal component
 */

import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/__tests__/helpers';
import { DateInputModal } from '@/modules/documents/components/DateInputModal';

describe('DateInputModal', () => {
  const mockOnClose = jest.fn();
  const mockOnConfirm = jest.fn();
  const mockOnPreview = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not render when isOpen is false', () => {
    renderWithProviders(
      <DateInputModal
        isOpen={false}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        onPreview={mockOnPreview}
      />
    );

    expect(screen.queryByText('Enter Date')).not.toBeInTheDocument();
  });

  it('should render modal when isOpen is true', () => {
    renderWithProviders(
      <DateInputModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        onPreview={mockOnPreview}
      />
    );

    expect(screen.getByText('Enter Date')).toBeInTheDocument();
  });

  it('should render date input field', () => {
    renderWithProviders(
      <DateInputModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        onPreview={mockOnPreview}
      />
    );

    const dateInput = screen.getByLabelText(/date/i);
    expect(dateInput).toBeInTheDocument();
    expect(dateInput).toHaveAttribute('type', 'date');
  });

  it('should render format input field', () => {
    renderWithProviders(
      <DateInputModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        onPreview={mockOnPreview}
      />
    );

    const formatInput = screen.getByLabelText(/format/i);
    expect(formatInput).toBeInTheDocument();
  });

  it('should render font size input field', () => {
    renderWithProviders(
      <DateInputModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        onPreview={mockOnPreview}
      />
    );

    const fontSizeInput = screen.getByLabelText(/font size/i);
    expect(fontSizeInput).toBeInTheDocument();
    expect(fontSizeInput).toHaveAttribute('type', 'number');
  });

  it('should use default date when provided', () => {
    const defaultDate = new Date('2024-01-15');
    renderWithProviders(
      <DateInputModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        onPreview={mockOnPreview}
        defaultDate={defaultDate}
      />
    );

    const dateInput = screen.getByLabelText(/date/i) as HTMLInputElement;
    expect(dateInput.value).toBe('2024-01-15');
  });

  it('should call onPreview when date changes', async () => {
    const { container } = renderWithProviders(
      <DateInputModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        onPreview={mockOnPreview}
      />
    );

    const dateInput = container.querySelector('input[type="date"]') as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: '2024-12-25' } });

    await waitFor(() => {
      expect(mockOnPreview).toHaveBeenCalled();
    });
  });

  it('should call onConfirm with correct values when confirm button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <DateInputModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        onPreview={mockOnPreview}
      />
    );

    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalled();
      const callArgs = mockOnConfirm.mock.calls[0];
      expect(callArgs[0]).toBeInstanceOf(Date);
      expect(callArgs[1]).toBe('MM/DD/YYYY');
      expect(callArgs[2]).toBe(12);
    });
  });

  it('should call onClose when cancel button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <DateInputModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        onPreview={mockOnPreview}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should reset state when cancel is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <DateInputModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        onPreview={mockOnPreview}
      />
    );

    const formatInput = screen.getByLabelText(/format/i);
    await user.clear(formatInput);
    await user.type(formatInput, 'DD/MM/YYYY');

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    const lastCall = mockOnPreview.mock.calls[mockOnPreview.mock.calls.length - 1];
    expect(lastCall[0]).toBeInstanceOf(Date);
    expect(lastCall[1]).toBe('MM/DD/YYYY');
    expect(lastCall[2]).toBe(12);
  });

  it('should reset state when confirm is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <DateInputModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        onPreview={mockOnPreview}
      />
    );

    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('should work without onPreview callback', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <DateInputModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    const dateInput = screen.getByLabelText(/date/i);
    await user.type(dateInput, '2024-12-25');

    expect(mockOnConfirm).not.toHaveBeenCalled();
  });

  it('should call onPreview when format changes', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <DateInputModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        onPreview={mockOnPreview}
      />
    );

    const formatInput = screen.getByLabelText(/format/i);
    await user.clear(formatInput);
    await user.type(formatInput, 'DD/MM/YYYY');

    await waitFor(() => {
      expect(mockOnPreview).toHaveBeenCalled();
    });
  });

  it('should call onPreview when font size changes', async () => {
    const { container } = renderWithProviders(
      <DateInputModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        onPreview={mockOnPreview}
      />
    );

    const fontSizeInput = container.querySelector('input[type="number"]') as HTMLInputElement;
    fireEvent.change(fontSizeInput, { target: { value: '16' } });

    await waitFor(() => {
      expect(mockOnPreview).toHaveBeenCalled();
      const lastCall = mockOnPreview.mock.calls[mockOnPreview.mock.calls.length - 1];
      expect(lastCall[2]).toBe(16);
    });
  });

  it('should handle font size with invalid value', async () => {
    const { container } = renderWithProviders(
      <DateInputModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        onPreview={mockOnPreview}
      />
    );

    const fontSizeInput = container.querySelector('input[type="number"]') as HTMLInputElement;
    fireEvent.change(fontSizeInput, { target: { value: 'invalid' } });

    await waitFor(() => {
      expect(mockOnPreview).toHaveBeenCalled();
      const lastCall = mockOnPreview.mock.calls[mockOnPreview.mock.calls.length - 1];
      expect(lastCall[2]).toBe(12);
    });
  });
});


