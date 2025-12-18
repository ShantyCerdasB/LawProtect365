// @ts-nocheck
/**
 * @fileoverview Element Type Popover Component Tests
 * @summary Tests for the ElementTypePopover component
 */

import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/__tests__/helpers';
import { ElementTypePopover } from '@/modules/documents/components/ElementTypePopover';

describe('ElementTypePopover', () => {
  const mockOnSelectSignature = jest.fn();
  const mockOnSelectText = jest.fn();
  const mockOnSelectDate = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not render when isOpen is false', () => {
    const { container } = renderWithProviders(
      <ElementTypePopover
        isOpen={false}
        x={100}
        y={200}
        onSelectSignature={mockOnSelectSignature}
        onSelectText={mockOnSelectText}
        onSelectDate={mockOnSelectDate}
        onClose={mockOnClose}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should render when isOpen is true', () => {
    renderWithProviders(
      <ElementTypePopover
        isOpen={true}
        x={100}
        y={200}
        onSelectSignature={mockOnSelectSignature}
        onSelectText={mockOnSelectText}
        onSelectDate={mockOnSelectDate}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText(/add signature/i)).toBeInTheDocument();
    expect(screen.getByText(/add text/i)).toBeInTheDocument();
    expect(screen.getByText(/add date/i)).toBeInTheDocument();
  });

  it('should render backdrop', () => {
    const { container } = renderWithProviders(
      <ElementTypePopover
        isOpen={true}
        x={100}
        y={200}
        onSelectSignature={mockOnSelectSignature}
        onSelectText={mockOnSelectText}
        onSelectDate={mockOnSelectDate}
        onClose={mockOnClose}
      />
    );

    const backdrop = container.querySelector('.fixed.inset-0');
    expect(backdrop).toBeInTheDocument();
  });

  it('should position popover at specified coordinates', () => {
    const { container } = renderWithProviders(
      <ElementTypePopover
        isOpen={true}
        x={150}
        y={250}
        onSelectSignature={mockOnSelectSignature}
        onSelectText={mockOnSelectText}
        onSelectDate={mockOnSelectDate}
        onClose={mockOnClose}
      />
    );

    const popover = container.querySelector('.fixed.z-50');
    expect(popover).toHaveStyle({ left: '150px', top: '250px' });
  });

  it('should call onSelectSignature and onClose when signature button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ElementTypePopover
        isOpen={true}
        x={100}
        y={200}
        onSelectSignature={mockOnSelectSignature}
        onSelectText={mockOnSelectText}
        onSelectDate={mockOnSelectDate}
        onClose={mockOnClose}
      />
    );

    const signatureButton = screen.getByText(/add signature/i);
    await user.click(signatureButton);

    expect(mockOnSelectSignature).toHaveBeenCalledTimes(1);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should call onSelectText and onClose when text button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ElementTypePopover
        isOpen={true}
        x={100}
        y={200}
        onSelectSignature={mockOnSelectSignature}
        onSelectText={mockOnSelectText}
        onSelectDate={mockOnSelectDate}
        onClose={mockOnClose}
      />
    );

    const textButton = screen.getByText(/add text/i);
    await user.click(textButton);

    expect(mockOnSelectText).toHaveBeenCalledTimes(1);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should call onSelectDate and onClose when date button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ElementTypePopover
        isOpen={true}
        x={100}
        y={200}
        onSelectSignature={mockOnSelectSignature}
        onSelectText={mockOnSelectText}
        onSelectDate={mockOnSelectDate}
        onClose={mockOnClose}
      />
    );

    const dateButton = screen.getByText(/add date/i);
    await user.click(dateButton);

    expect(mockOnSelectDate).toHaveBeenCalledTimes(1);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when backdrop is clicked', async () => {
    const user = userEvent.setup();
    const { container } = renderWithProviders(
      <ElementTypePopover
        isOpen={true}
        x={100}
        y={200}
        onSelectSignature={mockOnSelectSignature}
        onSelectText={mockOnSelectText}
        onSelectDate={mockOnSelectDate}
        onClose={mockOnClose}
      />
    );

    const backdrop = container.querySelector('.fixed.inset-0');
    if (backdrop) {
      await user.click(backdrop);
    }

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should not call onClose when popover content is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ElementTypePopover
        isOpen={true}
        x={100}
        y={200}
        onSelectSignature={mockOnSelectSignature}
        onSelectText={mockOnSelectText}
        onSelectDate={mockOnSelectDate}
        onClose={mockOnClose}
      />
    );

    const popoverContent = screen.getByText(/add signature/i).closest('div');
    if (popoverContent) {
      await user.click(popoverContent);
    }

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should prevent context menu on backdrop', () => {
    const { container } = renderWithProviders(
      <ElementTypePopover
        isOpen={true}
        x={100}
        y={200}
        onSelectSignature={mockOnSelectSignature}
        onSelectText={mockOnSelectText}
        onSelectDate={mockOnSelectDate}
        onClose={mockOnClose}
      />
    );

    const backdrop = container.querySelector('.fixed.inset-0');
    expect(backdrop).toBeInTheDocument();
    const contextMenuEvent = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
    backdrop?.dispatchEvent(contextMenuEvent);
    expect(contextMenuEvent.defaultPrevented).toBe(true);
  });

  it('should have proper styling classes', () => {
    const { container } = renderWithProviders(
      <ElementTypePopover
        isOpen={true}
        x={100}
        y={200}
        onSelectSignature={mockOnSelectSignature}
        onSelectText={mockOnSelectText}
        onSelectDate={mockOnSelectDate}
        onClose={mockOnClose}
      />
    );

    const popover = container.querySelector('.fixed.z-50');
    expect(popover).toHaveClass('bg-white', 'border', 'rounded-lg', 'shadow-xl');
  });
});




