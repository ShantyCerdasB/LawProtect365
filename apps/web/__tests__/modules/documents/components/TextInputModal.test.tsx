// @ts-nocheck
/**
 * @fileoverview Text Input Modal Component Tests
 * @summary Tests for the TextInputModal component
 */

import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/__tests__/helpers';
import { TextInputModal } from '@/modules/documents/components/TextInputModal';

describe('TextInputModal', () => {
  const mockOnClose = jest.fn();
  const mockOnConfirm = jest.fn();
  const mockOnPreview = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not render when isOpen is false', () => {
    renderWithProviders(
      <TextInputModal
        isOpen={false}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        onPreview={mockOnPreview}
      />
    );

    expect(screen.queryByText('Enter Text')).not.toBeInTheDocument();
  });

  it('should render modal when isOpen is true', () => {
    renderWithProviders(
      <TextInputModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        onPreview={mockOnPreview}
      />
    );

    expect(screen.getByText('Enter Text')).toBeInTheDocument();
  });

  it('should render text input field', () => {
    renderWithProviders(
      <TextInputModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        onPreview={mockOnPreview}
      />
    );

    const textInput = screen.getByLabelText(/text/i);
    expect(textInput).toBeInTheDocument();
    expect(textInput).toHaveAttribute('placeholder', 'Enter text to place on PDF');
  });

  it('should render font size input field', () => {
    renderWithProviders(
      <TextInputModal
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

  it('should use default text when provided', () => {
    renderWithProviders(
      <TextInputModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        onPreview={mockOnPreview}
        defaultText="Default text"
      />
    );

    const textInput = screen.getByLabelText(/text/i) as HTMLInputElement;
    expect(textInput.value).toBe('Default text');
  });

  it('should call onPreview when text changes', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <TextInputModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        onPreview={mockOnPreview}
      />
    );

    const textInput = screen.getByLabelText(/text/i);
    await user.type(textInput, 'Test text');

    await waitFor(() => {
      expect(mockOnPreview).toHaveBeenCalledWith('Test text', 12);
    });
  });

  it('should call onPreview when font size changes', async () => {
    const { container } = renderWithProviders(
      <TextInputModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        onPreview={mockOnPreview}
        defaultText="Test"
      />
    );

    const fontSizeInput = container.querySelector('input[type="number"]') as HTMLInputElement;
    fireEvent.change(fontSizeInput, { target: { value: '16' } });

    await waitFor(() => {
      expect(mockOnPreview).toHaveBeenCalledWith('Test', 16);
    });
  });

  it('should call onConfirm with trimmed text when confirm button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <TextInputModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        onPreview={mockOnPreview}
      />
    );

    const textInput = screen.getByLabelText(/text/i);
    await user.type(textInput, '  Test text  ');

    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalledWith('Test text', 12);
    });
  });

  it('should not call onConfirm if text is empty', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <TextInputModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        onPreview={mockOnPreview}
      />
    );

    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    await user.click(confirmButton);

    expect(mockOnConfirm).not.toHaveBeenCalled();
  });

  it('should call onClose when cancel button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <TextInputModal
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
      <TextInputModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        onPreview={mockOnPreview}
      />
    );

    const textInput = screen.getByLabelText(/text/i);
    await user.type(textInput, 'Test text');

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockOnPreview).toHaveBeenCalledWith('', 12);
  });

  it('should reset state when confirm is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <TextInputModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        onPreview={mockOnPreview}
      />
    );

    const textInput = screen.getByLabelText(/text/i);
    await user.type(textInput, 'Test text');

    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('should have min and max constraints on font size', () => {
    renderWithProviders(
      <TextInputModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        onPreview={mockOnPreview}
      />
    );

    const fontSizeInput = screen.getByLabelText(/font size/i);
    expect(fontSizeInput).toHaveAttribute('min', '8');
    expect(fontSizeInput).toHaveAttribute('max', '72');
  });

  it('should not call onPreview if text is empty', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <TextInputModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        onPreview={mockOnPreview}
      />
    );

    const fontSizeInput = screen.getByLabelText(/font size/i);
    await user.clear(fontSizeInput);
    await user.type(fontSizeInput, '16');

    await waitFor(() => {
      expect(mockOnPreview).not.toHaveBeenCalled();
    });
  });
});


