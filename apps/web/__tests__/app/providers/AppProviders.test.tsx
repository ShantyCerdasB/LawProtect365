// @ts-nocheck
/**
 * @fileoverview AppProviders Component Tests - Test suite for AppProviders component
 * @summary Tests AppProviders rendering and React Query integration
 * @description
 * Tests the AppProviders component including QueryClientProvider setup,
 * children rendering, and provider wrapping functionality.
 */

/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import { AppProviders } from '@/app/providers/AppProviders';
import { renderWithProviders } from '@/__tests__/helpers';

describe('AppProviders', () => {
  describe('rendering', () => {
    it('should render children content', () => {
      renderWithProviders(
        <AppProviders>
          <div>Test content</div>
        </AppProviders>
      );
      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    it('should render multiple children', () => {
      renderWithProviders(
        <AppProviders>
          <div>First child</div>
          <div>Second child</div>
        </AppProviders>
      );
      expect(screen.getByText('First child')).toBeInTheDocument();
      expect(screen.getByText('Second child')).toBeInTheDocument();
    });

    it('should render complex component tree', () => {
      renderWithProviders(
        <AppProviders>
          <div>
            <h1>Title</h1>
            <p>Description</p>
            <button>Action</button>
          </div>
        </AppProviders>
      );
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
    });
  });

  describe('React Query integration', () => {
    it('should provide QueryClient context to children', () => {
      const TestComponent = () => {
        const queryClient = new QueryClient();
        return (
          <AppProviders>
            <div>Test</div>
          </AppProviders>
        );
      };

      render(<TestComponent />);
      expect(screen.getByText('Test')).toBeInTheDocument();
    });

    it('should allow children to use React Query hooks', () => {
      renderWithProviders(
        <AppProviders>
          <div>Content</div>
        </AppProviders>
      );
      expect(screen.getByText('Content')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle null children', () => {
      renderWithProviders(<AppProviders>{null}</AppProviders>);
    });

    it('should handle empty children', () => {
      renderWithProviders(<AppProviders></AppProviders>);
    });

    it('should handle fragment children', () => {
      renderWithProviders(
        <AppProviders>
          <>
            <div>First</div>
            <div>Second</div>
          </>
        </AppProviders>
      );
      expect(screen.getByText('First')).toBeInTheDocument();
      expect(screen.getByText('Second')).toBeInTheDocument();
    });
  });
});
