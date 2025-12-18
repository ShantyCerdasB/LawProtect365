// @ts-nocheck
/**
 * @fileoverview PDF Pagination Controls Component Tests
 * @summary Tests for the PdfPaginationControls component
 */

import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/__tests__/helpers';
import { PdfPaginationControls } from '@/modules/documents/components/PdfPaginationControls';

describe('PdfPaginationControls', () => {
  const mockOnPrevious = jest.fn();
  const mockOnNext = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render pagination controls', () => {
    renderWithProviders(
      <PdfPaginationControls
        currentPage={1}
        totalPages={5}
        onPrevious={mockOnPrevious}
        onNext={mockOnNext}
      />
    );

    expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
    expect(screen.getByText('Page')).toBeInTheDocument();
  });

  it('should display current page number', () => {
    renderWithProviders(
      <PdfPaginationControls
        currentPage={3}
        totalPages={5}
        onPrevious={mockOnPrevious}
        onNext={mockOnNext}
      />
    );

    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('should display total pages', () => {
    renderWithProviders(
      <PdfPaginationControls
        currentPage={1}
        totalPages={10}
        onPrevious={mockOnPrevious}
        onNext={mockOnNext}
      />
    );

    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('should disable previous button on first page', () => {
    renderWithProviders(
      <PdfPaginationControls
        currentPage={1}
        totalPages={5}
        onPrevious={mockOnPrevious}
        onNext={mockOnNext}
      />
    );

    const previousButton = screen.getByRole('button', { name: /previous/i });
    expect(previousButton).toBeDisabled();
  });

  it('should enable previous button when not on first page', () => {
    renderWithProviders(
      <PdfPaginationControls
        currentPage={3}
        totalPages={5}
        onPrevious={mockOnPrevious}
        onNext={mockOnNext}
      />
    );

    const previousButton = screen.getByRole('button', { name: /previous/i });
    expect(previousButton).not.toBeDisabled();
  });

  it('should disable next button on last page', () => {
    renderWithProviders(
      <PdfPaginationControls
        currentPage={5}
        totalPages={5}
        onPrevious={mockOnPrevious}
        onNext={mockOnNext}
      />
    );

    const nextButton = screen.getByRole('button', { name: /next/i });
    expect(nextButton).toBeDisabled();
  });

  it('should enable next button when not on last page', () => {
    renderWithProviders(
      <PdfPaginationControls
        currentPage={3}
        totalPages={5}
        onPrevious={mockOnPrevious}
        onNext={mockOnNext}
      />
    );

    const nextButton = screen.getByRole('button', { name: /next/i });
    expect(nextButton).not.toBeDisabled();
  });

  it('should call onPrevious when previous button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <PdfPaginationControls
        currentPage={3}
        totalPages={5}
        onPrevious={mockOnPrevious}
        onNext={mockOnNext}
      />
    );

    const previousButton = screen.getByRole('button', { name: /previous/i });
    await user.click(previousButton);

    expect(mockOnPrevious).toHaveBeenCalledTimes(1);
  });

  it('should call onNext when next button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <PdfPaginationControls
        currentPage={3}
        totalPages={5}
        onPrevious={mockOnPrevious}
        onNext={mockOnNext}
      />
    );

    const nextButton = screen.getByRole('button', { name: /next/i });
    await user.click(nextButton);

    expect(mockOnNext).toHaveBeenCalledTimes(1);
  });

  it('should not call onPrevious when previous button is disabled', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <PdfPaginationControls
        currentPage={1}
        totalPages={5}
        onPrevious={mockOnPrevious}
        onNext={mockOnNext}
      />
    );

    const previousButton = screen.getByRole('button', { name: /previous/i });
    await user.click(previousButton);

    expect(mockOnPrevious).not.toHaveBeenCalled();
  });

  it('should not call onNext when next button is disabled', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <PdfPaginationControls
        currentPage={5}
        totalPages={5}
        onPrevious={mockOnPrevious}
        onNext={mockOnNext}
      />
    );

    const nextButton = screen.getByRole('button', { name: /next/i });
    await user.click(nextButton);

    expect(mockOnNext).not.toHaveBeenCalled();
  });

  it('should have proper styling classes', () => {
    const { container } = renderWithProviders(
      <PdfPaginationControls
        currentPage={1}
        totalPages={5}
        onPrevious={mockOnPrevious}
        onNext={mockOnNext}
      />
    );

    const containerDiv = container.firstChild as HTMLElement;
    expect(containerDiv).toHaveClass('flex', 'items-center', 'justify-between');
  });

  it('should display "of" separator', () => {
    renderWithProviders(
      <PdfPaginationControls
        currentPage={1}
        totalPages={5}
        onPrevious={mockOnPrevious}
        onNext={mockOnNext}
      />
    );

    expect(screen.getByText('of')).toBeInTheDocument();
  });
});



