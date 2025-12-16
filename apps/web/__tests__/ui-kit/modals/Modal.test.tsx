// @ts-nocheck
/**
 * @fileoverview Modal Component Tests - Test suite for Modal component
 * @summary Tests Modal rendering, open/close states, interactions, and accessibility
 * @description
 * Tests the Modal component including visibility state, title rendering, close handlers,
 * backdrop clicks, content rendering, and accessibility features.
 */

/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from '@/ui-kit/modals/Modal';
import { renderWithProviders, createModalProps } from '@/__tests__/helpers';

describe('Modal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('visibility', () => {
    it('should render modal when isOpen is true', () => {
      renderWithProviders(
        <Modal isOpen={true}>
          <div>Modal content</div>
        </Modal>
      );
      expect(screen.getByText('Modal content')).toBeInTheDocument();
    });

    it('should not render modal when isOpen is false', () => {
      renderWithProviders(
        <Modal isOpen={false}>
          <div>Modal content</div>
        </Modal>
      );
      expect(screen.queryByText('Modal content')).not.toBeInTheDocument();
    });

    it('should render modal by default when isOpen is not provided', () => {
      renderWithProviders(
        <Modal>
          <div>Modal content</div>
        </Modal>
      );
      expect(screen.getByText('Modal content')).toBeInTheDocument();
    });
  });

  describe('title', () => {
    it('should render title when provided', () => {
      renderWithProviders(
        <Modal isOpen={true} title="Test Modal">
          <div>Content</div>
        </Modal>
      );
      expect(screen.getByText('Test Modal')).toBeInTheDocument();
    });

    it('should not render title when not provided', () => {
      renderWithProviders(
        <Modal isOpen={true}>
          <div>Content</div>
        </Modal>
      );
      const title = screen.queryByRole('heading');
      expect(title).not.toBeInTheDocument();
    });

    it('should render close button when title and onClose are provided', () => {
      const onClose = jest.fn();
      renderWithProviders(
        <Modal isOpen={true} title="Test Modal" onClose={onClose}>
          <div>Content</div>
        </Modal>
      );
      expect(screen.getByLabelText('Close modal')).toBeInTheDocument();
    });

    it('should not render close button when onClose is not provided', () => {
      renderWithProviders(
        <Modal isOpen={true} title="Test Modal">
          <div>Content</div>
        </Modal>
      );
      const closeButton = screen.queryByLabelText('Close modal');
      expect(closeButton).not.toBeInTheDocument();
    });
  });

  describe('content', () => {
    it('should render children content', () => {
      renderWithProviders(
        <Modal isOpen={true}>
          <div>Modal content</div>
        </Modal>
      );
      expect(screen.getByText('Modal content')).toBeInTheDocument();
    });

    it('should render multiple children', () => {
      renderWithProviders(
        <Modal isOpen={true}>
          <div>First content</div>
          <div>Second content</div>
        </Modal>
      );
      expect(screen.getByText('First content')).toBeInTheDocument();
      expect(screen.getByText('Second content')).toBeInTheDocument();
    });

    it('should render complex content structures', () => {
      renderWithProviders(
        <Modal isOpen={true}>
          <div>
            <h3>Title</h3>
            <p>Description</p>
            <button>Action</button>
          </div>
        </Modal>
      );
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
    });
  });

  describe('close interactions', () => {
    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      renderWithProviders(
        <Modal isOpen={true} title="Test Modal" onClose={onClose}>
          <div>Content</div>
        </Modal>
      );

      const closeButton = screen.getByLabelText('Close modal');
      await user.click(closeButton);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when backdrop is clicked', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      renderWithProviders(
        <Modal isOpen={true} onClose={onClose}>
          <div>Content</div>
        </Modal>
      );

      const backdrop = screen.getByText('Content').closest('.fixed');
      if (backdrop) {
        await user.click(backdrop);
        expect(onClose).toHaveBeenCalledTimes(1);
      }
    });

    it('should not call onClose when modal content is clicked', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      renderWithProviders(
        <Modal isOpen={true} onClose={onClose}>
          <div>Content</div>
        </Modal>
      );

      const content = screen.getByText('Content');
      await user.click(content);
      expect(onClose).not.toHaveBeenCalled();
    });

    it('should not call onClose when onClose is not provided', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <Modal isOpen={true}>
          <div>Content</div>
        </Modal>
      );

      const backdrop = screen.getByText('Content').closest('.fixed');
      if (backdrop) {
        await user.click(backdrop);
      }
    });
  });

  describe('styling', () => {
    it('should have backdrop styling', () => {
      renderWithProviders(
        <Modal isOpen={true}>
          <div>Content</div>
        </Modal>
      );
      const backdrop = screen.getByText('Content').closest('.fixed');
      expect(backdrop).toHaveClass('bg-black/40');
    });

    it('should have modal content styling', () => {
      renderWithProviders(
        <Modal isOpen={true}>
          <div>Content</div>
        </Modal>
      );
      const content = screen.getByText('Content').closest('.bg-white');
      expect(content).toHaveClass('bg-white', 'p-6', 'rounded-lg', 'shadow-xl');
    });
  });

  describe('accessibility', () => {
    it('should have close button with aria-label', () => {
      const onClose = jest.fn();
      renderWithProviders(
        <Modal isOpen={true} title="Test Modal" onClose={onClose}>
          <div>Content</div>
        </Modal>
      );
      expect(screen.getByLabelText('Close modal')).toBeInTheDocument();
    });

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      renderWithProviders(
        <Modal isOpen={true} title="Test Modal" onClose={onClose}>
          <div>Content</div>
        </Modal>
      );

      const closeButton = screen.getByLabelText('Close modal');
      closeButton.focus();
      await user.keyboard('{Enter}');
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('edge cases', () => {
    it('should handle null children', () => {
      renderWithProviders(<Modal isOpen={true}>{null}</Modal>);
      const backdrop = document.querySelector('.fixed');
      expect(backdrop).toBeInTheDocument();
    });

    it('should handle empty children', () => {
      renderWithProviders(<Modal isOpen={true}></Modal>);
      const backdrop = document.querySelector('.fixed');
      expect(backdrop).toBeInTheDocument();
    });

    it('should handle rapid open/close state changes', () => {
      const { rerender } = renderWithProviders(
        <Modal isOpen={true}>
          <div>Content</div>
        </Modal>
      );
      expect(screen.getByText('Content')).toBeInTheDocument();

      rerender(
        <Modal isOpen={false}>
          <div>Content</div>
        </Modal>
      );
      expect(screen.queryByText('Content')).not.toBeInTheDocument();

      rerender(
        <Modal isOpen={true}>
          <div>Content</div>
        </Modal>
      );
      expect(screen.getByText('Content')).toBeInTheDocument();
    });
  });
});
