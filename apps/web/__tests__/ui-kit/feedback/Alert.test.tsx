// @ts-nocheck
/**
 * @fileoverview Alert Component Tests - Test suite for Alert component
 * @summary Tests Alert rendering, variants, titles, and styling
 * @description
 * Tests the Alert component including all tone variants (info, success, warning, error),
 * title rendering, message display, and styling classes.
 */

/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, beforeEach } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { Alert } from '@ui-kit/feedback/Alert';
import { renderWithProviders, createAlertProps } from '@/__tests__/helpers';

describe('Alert', () => {
  describe('rendering', () => {
    it('should render alert with message', () => {
      renderWithProviders(<Alert message="Test alert message" />);
      expect(screen.getByText('Test alert message')).toBeInTheDocument();
    });

    it('should render title when provided', () => {
      renderWithProviders(
        <Alert title="Alert Title" message="Test alert message" />
      );
      expect(screen.getByText('Alert Title')).toBeInTheDocument();
    });

    it('should not render title when not provided', () => {
      renderWithProviders(<Alert message="Test alert message" />);
      const title = screen.queryByText('Alert Title');
      expect(title).not.toBeInTheDocument();
    });
  });

  describe('tone variants', () => {
    it('should render info tone by default', () => {
      const { container } = renderWithProviders(<Alert message="Info message" />);
      const alert = container.firstChild as HTMLElement;
      expect(alert).toHaveClass('bg-blue-50', 'text-blue-800', 'border-blue-200');
    });

    it('should render success tone', () => {
      const { container } = renderWithProviders(<Alert message="Success message" tone="success" />);
      const alert = container.firstChild as HTMLElement;
      expect(alert).toHaveClass('bg-green-50', 'text-green-800', 'border-green-200');
    });

    it('should render warning tone', () => {
      const { container } = renderWithProviders(<Alert message="Warning message" tone="warning" />);
      const alert = container.firstChild as HTMLElement;
      expect(alert).toHaveClass('bg-yellow-50', 'text-yellow-800', 'border-yellow-200');
    });

    it('should render error tone', () => {
      const { container } = renderWithProviders(<Alert message="Error message" tone="error" />);
      const alert = container.firstChild as HTMLElement;
      expect(alert).toHaveClass('bg-red-50', 'text-red-800', 'border-red-200');
    });
  });

  describe('styling', () => {
    it('should have base styling classes', () => {
      const { container } = renderWithProviders(<Alert message="Test message" />);
      const alert = container.firstChild as HTMLElement;
      expect(alert).toHaveClass('border', 'rounded', 'p-3');
    });

    it('should render title with semibold font', () => {
      renderWithProviders(
        <Alert title="Title" message="Message" />
      );
      const title = screen.getByText('Title');
      expect(title).toHaveClass('font-semibold', 'mb-1');
    });
  });

  describe('edge cases', () => {
    it('should handle empty message', () => {
      renderWithProviders(<Alert message="" />);
      const alert = document.querySelector('.border');
      expect(alert).toBeInTheDocument();
    });

    it('should handle empty title', () => {
      renderWithProviders(<Alert title="" message="Message" />);
      const alert = screen.getByText('Message');
      expect(alert).toBeInTheDocument();
    });

    it('should handle long messages', () => {
      const longMessage = 'A'.repeat(500);
      renderWithProviders(<Alert message={longMessage} />);
      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });
  });
});
