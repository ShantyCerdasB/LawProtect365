// @ts-nocheck
/**
 * @fileoverview AppLayout Component Tests - Test suite for AppLayout component
 * @summary Tests AppLayout rendering, Header, Footer, and Outlet integration
 * @description
 * Tests the AppLayout component including Header and Footer rendering,
 * Outlet for nested routes, and layout structure.
 */

/// <reference types="@testing-library/jest-dom" />
import React from 'react';
import { describe, it, expect, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { AppLayout } from '@/app/layout/AppLayout';
import { renderWithProviders } from '@/__tests__/helpers';

jest.mock('@/ui-kit/layout/Header', () => ({
  Header: () => <header data-testid="header">Header</header>,
}));

jest.mock('@/ui-kit/layout/components/Footer', () => ({
  Footer: () => <footer data-testid="footer">Footer</footer>,
}));

describe('AppLayout', () => {
  describe('rendering', () => {
    it('should render Header component', () => {
      renderWithProviders(<AppLayout />);
      expect(screen.getByTestId('header')).toBeInTheDocument();
    });

    it('should render Footer component', () => {
      renderWithProviders(<AppLayout />);
      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });

    it('should render main element with Outlet', () => {
      renderWithProviders(<AppLayout />);
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });

    it('should have correct layout structure', () => {
      renderWithProviders(<AppLayout />);
      const container = screen.getByTestId('header').closest('.min-h-screen');
      expect(container).toBeInTheDocument();
    });
  });

  describe('layout structure', () => {
    it('should have flex column layout', () => {
      renderWithProviders(<AppLayout />);
      const container = screen.getByTestId('header').closest('.flex.flex-col');
      expect(container).toBeInTheDocument();
    });

    it('should have flex-1 on main element', () => {
      renderWithProviders(<AppLayout />);
      const main = screen.getByRole('main');
      expect(main).toHaveClass('flex-1');
    });

    it('should have min-h-screen on container', () => {
      renderWithProviders(<AppLayout />);
      const container = screen.getByTestId('header').closest('.min-h-screen');
      expect(container).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should render with empty outlet content', () => {
      renderWithProviders(<AppLayout />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });
});
