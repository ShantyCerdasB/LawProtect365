// @ts-nocheck
/**
 * @fileoverview Signature Canvas Component Tests
 * @summary Tests for the SignatureCanvas component
 */

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/__tests__/helpers';
import { SignatureCanvas } from '@/modules/documents/components/SignatureCanvas';

jest.mock('react-signature-canvas', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(({ ref, onEnd, onBegin }) => {
      if (ref) {
        ref.current = {
          clear: jest.fn(),
          isEmpty: () => true,
          toDataURL: () => 'data:image/png;base64,test',
        };
      }
      return (
        <div data-testid="signature-canvas">
          <button
            data-testid="trigger-end"
            onClick={() => {
              if (onEnd) onEnd();
            }}
          >
            Trigger End
          </button>
          <button
            data-testid="trigger-begin"
            onClick={() => {
              if (onBegin) onBegin();
            }}
          >
            Trigger Begin
          </button>
        </div>
      );
    }),
  };
});

HTMLCanvasElement.prototype.getContext = jest.fn((contextType: string) => {
  if (contextType === '2d') {
    return {
      clearRect: jest.fn(),
      fillText: jest.fn(),
      measureText: jest.fn(() => ({ width: 100 })),
      font: '',
      fillStyle: '',
      textAlign: '',
      textBaseline: '',
      drawImage: jest.fn(),
      setTransform: jest.fn(),
    } as any;
  }
  return null;
}) as any;

describe('SignatureCanvas', () => {
  const mockOnClose = jest.fn();
  const mockOnConfirm = jest.fn();
  const mockOnPreview = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not render when isOpen is false', () => {
    renderWithProviders(
      <SignatureCanvas
        isOpen={false}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        onPreview={mockOnPreview}
      />
    );

    expect(screen.queryByText(/signature/i)).not.toBeInTheDocument();
  });

  it('should render modal when isOpen is true', () => {
    renderWithProviders(
      <SignatureCanvas
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        onPreview={mockOnPreview}
      />
    );

    expect(screen.getByText(/signature/i)).toBeInTheDocument();
  });

  it('should render draw and type tabs', () => {
    renderWithProviders(
      <SignatureCanvas
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        onPreview={mockOnPreview}
      />
    );

    expect(screen.getByText(/draw/i)).toBeInTheDocument();
    expect(screen.getByText(/type/i)).toBeInTheDocument();
  });

  it('should render signature canvas in draw tab', () => {
    renderWithProviders(
      <SignatureCanvas
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        onPreview={mockOnPreview}
      />
    );

    expect(screen.getByTestId('signature-canvas')).toBeInTheDocument();
  });

  it('should switch to type tab when clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <SignatureCanvas
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        onPreview={mockOnPreview}
      />
    );

    const typeTab = screen.getByText(/type/i);
    await user.click(typeTab);

    expect(screen.getByPlaceholderText(/enter your signature/i)).toBeInTheDocument();
  });

  it('should render text input in type tab', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <SignatureCanvas
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        onPreview={mockOnPreview}
      />
    );

    const typeTab = screen.getByText(/type/i);
    await user.click(typeTab);

    const textInput = screen.getByPlaceholderText(/enter your signature/i);
    expect(textInput).toBeInTheDocument();
  });

  it('should render color and font selectors in type tab', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <SignatureCanvas
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        onPreview={mockOnPreview}
      />
    );

    const typeTab = screen.getByText(/type/i);
    await user.click(typeTab);

    expect(screen.getByText(/select color/i)).toBeInTheDocument();
    expect(screen.getByText(/change font/i)).toBeInTheDocument();
  });

  it('should render clear button', () => {
    renderWithProviders(
      <SignatureCanvas
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        onPreview={mockOnPreview}
      />
    );

    expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
  });

  it('should render confirm and cancel buttons', () => {
    renderWithProviders(
      <SignatureCanvas
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        onPreview={mockOnPreview}
      />
    );

    expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('should call onClose when cancel button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <SignatureCanvas
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

  it('should disable confirm button when signature is empty', () => {
    renderWithProviders(
      <SignatureCanvas
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        onPreview={mockOnPreview}
      />
    );

    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    expect(confirmButton).toBeDisabled();
  });

  it('should update typed text when input changes', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <SignatureCanvas
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        onPreview={mockOnPreview}
      />
    );

    const typeTab = screen.getByText(/type/i);
    await user.click(typeTab);

    const textInput = screen.getByPlaceholderText(/enter your signature/i);
    await user.type(textInput, 'John Doe');

    expect((textInput as HTMLInputElement).value).toBe('John Doe');
  });

  it('should enforce max length on typed text', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <SignatureCanvas
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        onPreview={mockOnPreview}
      />
    );

    const typeTab = screen.getByText(/type/i);
    await user.click(typeTab);

    const textInput = screen.getByPlaceholderText(/enter your signature/i);
    await user.clear(textInput);
    await user.type(textInput, 'a'.repeat(75));

    expect((textInput as HTMLInputElement).value.length).toBeLessThanOrEqual(75);
    
    await user.type(textInput, 'a'.repeat(25));

    expect((textInput as HTMLInputElement).value.length).toBeLessThanOrEqual(75);
  }, 10000);

  it('should generate typed signature preview when text is entered', async () => {
    const user = userEvent.setup();
    const { container } = renderWithProviders(
      <SignatureCanvas
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        onPreview={mockOnPreview}
      />
    );

    const typeTab = screen.getByText(/type/i);
    await user.click(typeTab);

    const textInput = screen.getByPlaceholderText(/enter your signature/i);
    await user.type(textInput, 'John Doe');

    await waitFor(() => {
      expect(mockOnPreview).toHaveBeenCalled();
    });
  });

  it('should clear typed signature preview when text is empty', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <SignatureCanvas
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        onPreview={mockOnPreview}
      />
    );

    const typeTab = screen.getByText(/type/i);
    await user.click(typeTab);

    const textInput = screen.getByPlaceholderText(/enter your signature/i);
    await user.type(textInput, 'Test');
    await user.clear(textInput);

    await waitFor(() => {
      expect(mockOnPreview).toHaveBeenCalledWith('');
    });
  });

  it('should handle clear for draw tab', async () => {
    const user = userEvent.setup();
    const mockClear = jest.fn();
    const SignatureCanvasLib = require('react-signature-canvas').default;
    SignatureCanvasLib.mockImplementation(({ ref, onBegin, onEnd }) => {
      if (ref) {
        ref.current = {
          clear: mockClear,
          isEmpty: () => true,
          toDataURL: () => 'data:image/png;base64,test',
        };
      }
      return (
        <div data-testid="signature-canvas">
          <button onClick={onBegin}>Begin</button>
          <button onClick={onEnd}>End</button>
        </div>
      );
    });

    renderWithProviders(
      <SignatureCanvas
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        onPreview={mockOnPreview}
      />
    );

    const clearButton = screen.getByRole('button', { name: /clear/i });
    await user.click(clearButton);

    expect(mockClear).toHaveBeenCalled();
  });

  it('should handle clear for type tab', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <SignatureCanvas
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        onPreview={mockOnPreview}
      />
    );

    const typeTab = screen.getByText(/type/i);
    await user.click(typeTab);

    const textInput = screen.getByPlaceholderText(/enter your signature/i);
    await user.type(textInput, 'Test');

    const clearButton = screen.getByRole('button', { name: /clear/i });
    await user.click(clearButton);

    expect((textInput as HTMLInputElement).value).toBe('');
    expect(mockOnPreview).toHaveBeenCalledWith('');
  });

  it('should handle confirm for draw tab with signature', async () => {
    const user = userEvent.setup();
    const mockToDataURL = jest.fn(() => 'data:image/png;base64,test');
    const mockIsEmpty = jest.fn(() => false);
    const SignatureCanvasLib = require('react-signature-canvas').default;
    SignatureCanvasLib.mockImplementation(({ ref, onBegin }) => {
      if (ref) {
        ref.current = {
          clear: jest.fn(),
          isEmpty: mockIsEmpty,
          toDataURL: mockToDataURL,
        };
      }
      return (
        <div data-testid="signature-canvas">
          <button onClick={onBegin}>Begin</button>
        </div>
      );
    });

    renderWithProviders(
      <SignatureCanvas
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        onPreview={mockOnPreview}
      />
    );

    const beginButton = screen.getByText('Begin');
    await user.click(beginButton);

    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    expect(confirmButton).not.toBeDisabled();

    await user.click(confirmButton);

    expect(mockToDataURL).toHaveBeenCalled();
    expect(mockOnConfirm).toHaveBeenCalledWith('data:image/png;base64,test', 150, 60);
  });

  it('should handle confirm for type tab with text', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <SignatureCanvas
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        onPreview={mockOnPreview}
      />
    );

    const typeTab = screen.getByText(/type/i);
    await user.click(typeTab);

    const textInput = screen.getByPlaceholderText(/enter your signature/i);
    await user.clear(textInput);
    await user.type(textInput, 'John Doe');

    await waitFor(() => {
      expect(mockOnPreview).toHaveBeenCalled();
    }, { timeout: 3000 });

    await waitFor(() => {
      const btn = screen.getByRole('button', { name: /confirm/i });
      expect(btn).not.toBeDisabled();
    }, { timeout: 5000 });

    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalled();
      const callArgs = mockOnConfirm.mock.calls[0];
      expect(callArgs[0]).toContain('data:image/png;base64');
      expect(callArgs[1]).toBe(512);
      expect(callArgs[2]).toBe(256);
    }, { timeout: 3000 });
  }, 15000);

  it('should handle begin drawing', async () => {
    const user = userEvent.setup();
    const mockOnBegin = jest.fn();
    const SignatureCanvasLib = require('react-signature-canvas').default;
    SignatureCanvasLib.mockImplementation(({ ref, onBegin }) => {
      if (ref) {
        ref.current = {
          clear: jest.fn(),
          isEmpty: () => false,
          toDataURL: () => 'data:image/png;base64,test',
        };
      }
      return (
        <div data-testid="signature-canvas">
          <button onClick={onBegin}>Begin</button>
        </div>
      );
    });

    renderWithProviders(
      <SignatureCanvas
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        onPreview={mockOnPreview}
      />
    );

    const beginButton = screen.getByText('Begin');
    await user.click(beginButton);

    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    expect(confirmButton).not.toBeDisabled();
  });

  it('should handle end drawing and update preview', async () => {
    const user = userEvent.setup();
    const mockToDataURL = jest.fn(() => 'data:image/png;base64,test');
    const mockIsEmpty = jest.fn(() => false);
    const SignatureCanvasLib = require('react-signature-canvas').default;
    SignatureCanvasLib.mockImplementation(({ ref, onEnd }) => {
      if (ref) {
        ref.current = {
          clear: jest.fn(),
          isEmpty: mockIsEmpty,
          toDataURL: mockToDataURL,
        };
      }
      return (
        <div data-testid="signature-canvas">
          <button onClick={onEnd}>End</button>
        </div>
      );
    });

    renderWithProviders(
      <SignatureCanvas
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        onPreview={mockOnPreview}
      />
    );

    const endButton = screen.getByText('End');
    await user.click(endButton);

    await waitFor(() => {
      expect(mockToDataURL).toHaveBeenCalled();
      expect(mockOnPreview).toHaveBeenCalledWith('data:image/png;base64,test');
    });
  });

  it('should handle color selection', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <SignatureCanvas
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        onPreview={mockOnPreview}
      />
    );

    const typeTab = screen.getByText(/type/i);
    await user.click(typeTab);

    const textInput = screen.getByPlaceholderText(/enter your signature/i);
    await user.type(textInput, 'Test');

    const colorButtons = screen.getAllByTitle(/black|blue|red|green|purple/i);
    await user.click(colorButtons[1]);

    await waitFor(() => {
      expect(mockOnPreview).toHaveBeenCalled();
    });
  });

  it('should handle font selection', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <SignatureCanvas
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        onPreview={mockOnPreview}
      />
    );

    const typeTab = screen.getByText(/type/i);
    await user.click(typeTab);

    const textInput = screen.getByPlaceholderText(/enter your signature/i);
    await user.type(textInput, 'Test');

    const fontSelect = screen.getByText(/change font/i).closest('div')?.querySelector('select');
    if (fontSelect) {
      await user.selectOptions(fontSelect, '"Great Vibes", cursive');

      await waitFor(() => {
        expect(mockOnPreview).toHaveBeenCalled();
      });
    }
  });

  it('should not call onConfirm when draw signature is empty', async () => {
    const user = userEvent.setup();
    const mockIsEmpty = jest.fn(() => true);
    const SignatureCanvasLib = require('react-signature-canvas').default;
    SignatureCanvasLib.mockImplementation(({ ref }) => {
      if (ref) {
        ref.current = {
          clear: jest.fn(),
          isEmpty: mockIsEmpty,
          toDataURL: () => 'data:image/png;base64,test',
        };
      }
      return <div data-testid="signature-canvas" />;
    });

    renderWithProviders(
      <SignatureCanvas
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        onPreview={mockOnPreview}
      />
    );

    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    expect(confirmButton).toBeDisabled();
  });

  it('should not call onConfirm when type text is empty', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <SignatureCanvas
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        onPreview={mockOnPreview}
      />
    );

    const typeTab = screen.getByText(/type/i);
    await user.click(typeTab);

    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    expect(confirmButton).toBeDisabled();
  });
});


