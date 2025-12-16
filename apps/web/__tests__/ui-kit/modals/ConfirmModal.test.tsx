// @ts-nocheck
/**
 * @fileoverview ConfirmModal Component Tests - Test suite for ConfirmModal component
 * @summary Tests ConfirmModal rendering, confirm/cancel actions, and interactions
 * @description
 * Tests the ConfirmModal component including title rendering, content display,
 * confirm and cancel button interactions, and accessibility.
 */

/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmModal } from '@/ui-kit/modals/ConfirmModal';
import { renderWithProviders } from '@/__tests__/helpers';

describe('ConfirmModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render modal with children content', () => {
      renderWithProviders(
        <ConfirmModal>
          <div>Are you sure?</div>
        </ConfirmModal>
      );
      expect(screen.getByText('Are you sure?')).toBeInTheDocument();
    });

    it('should render title when provided', () => {
      renderWithProviders(
        <ConfirmModal title="Confirm Action">
          <div>Are you sure?</div>
        </ConfirmModal>
      );
      expect(screen.getByText('Confirm Action')).toBeInTheDocument();
    });

    it('should not render title when not provided', () => {
      renderWithProviders(
        <ConfirmModal>
          <div>Are you sure?</div>
        </ConfirmModal>
      );
      const heading = screen.queryByRole('heading');
      expect(heading).not.toBeInTheDocument();
    });

    it('should render confirm and cancel buttons', () => {
      renderWithProviders(
        <ConfirmModal>
          <div>Are you sure?</div>
        </ConfirmModal>
      );
      expect(screen.getByRole('button', { name: /confirmar/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
    });
  });

  describe('confirm action', () => {
    it('should call onConfirm when confirm button is clicked', async () => {
      const user = userEvent.setup();
      const onConfirm = jest.fn();
      renderWithProviders(
        <ConfirmModal onConfirm={onConfirm}>
          <div>Are you sure?</div>
        </ConfirmModal>
      );

      const confirmButton = screen.getByRole('button', { name: /confirmar/i });
      await user.click(confirmButton);
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('should not call onConfirm when not provided', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <ConfirmModal>
          <div>Are you sure?</div>
        </ConfirmModal>
      );

      const confirmButton = screen.getByRole('button', { name: /confirmar/i });
      await user.click(confirmButton);
    });
  });

  describe('cancel action', () => {
    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      const onCancel = jest.fn();
      renderWithProviders(
        <ConfirmModal onCancel={onCancel}>
          <div>Are you sure?</div>
        </ConfirmModal>
      );

      const cancelButton = screen.getByRole('button', { name: /cancelar/i });
      await user.click(cancelButton);
      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('should not call onCancel when not provided', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <ConfirmModal>
          <div>Are you sure?</div>
        </ConfirmModal>
      );

      const cancelButton = screen.getByRole('button', { name: /cancelar/i });
      await user.click(cancelButton);
    });
  });

  describe('styling', () => {
    it('should have backdrop styling', () => {
      renderWithProviders(
        <ConfirmModal>
          <div>Content</div>
        </ConfirmModal>
      );
      const backdrop = screen.getByText('Content').closest('.fixed');
      expect(backdrop).toHaveClass('bg-black/40');
    });

    it('should have modal content styling', () => {
      renderWithProviders(
        <ConfirmModal>
          <div>Content</div>
        </ConfirmModal>
      );
      const content = screen.getByText('Content').closest('.bg-white');
      expect(content).toHaveClass('bg-white', 'p-4', 'rounded', 'shadow-lg');
    });
  });

  describe('edge cases', () => {
    it('should handle null children', () => {
      renderWithProviders(<ConfirmModal>{null}</ConfirmModal>);
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBe(2);
    });

    it('should handle empty children', () => {
      renderWithProviders(<ConfirmModal></ConfirmModal>);
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBe(2);
    });

    it('should handle both onConfirm and onCancel', async () => {
      const user = userEvent.setup();
      const onConfirm = jest.fn();
      const onCancel = jest.fn();
      renderWithProviders(
        <ConfirmModal onConfirm={onConfirm} onCancel={onCancel}>
          <div>Are you sure?</div>
        </ConfirmModal>
      );

      await user.click(screen.getByRole('button', { name: /confirmar/i }));
      expect(onConfirm).toHaveBeenCalledTimes(1);

      await user.click(screen.getByRole('button', { name: /cancelar/i }));
      expect(onCancel).toHaveBeenCalledTimes(1);
    });
  });
});
