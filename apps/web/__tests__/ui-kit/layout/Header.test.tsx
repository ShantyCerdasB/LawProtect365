// @ts-nocheck
/**
 * @fileoverview Header Component Tests
 * @summary Tests for the Header component
 */

/// <reference types="@testing-library/jest-dom" />
import React from 'react';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/__tests__/helpers';
import { Header } from '@/ui-kit/layout/Header';
import { useAuthStore } from '@/app/store/useAuthStore';

jest.mock('@/app/store/useAuthStore');

const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom') as Record<string, unknown>;
  return {
    ...actual,
    useNavigate: jest.fn(() => mockNavigate),
  };
});

describe('Header', () => {
  const mockLogin = jest.fn();
  const mockLogout = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthStore.mockReturnValue({
      isAuthenticated: false,
      login: mockLogin,
      logout: mockLogout,
      user: null,
    } as any);
  });

  it('should render header with logo link', () => {
    renderWithProviders(<Header />);
    
    const logoLink = screen.getByRole('link', { name: /law protect/i });
    expect(logoLink).toBeInTheDocument();
    expect(logoLink).toHaveAttribute('href', '/');
  });

  it('should render public menu items when not authenticated', () => {
    renderWithProviders(<Header />);
    
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('should render sign in button when not authenticated', () => {
    renderWithProviders(<Header />);
    
    const signInButton = screen.getByRole('button', { name: /sign in/i });
    expect(signInButton).toBeInTheDocument();
  });

  it('should render language selector when not authenticated', () => {
    renderWithProviders(<Header />);
    
    const languageSelector = screen.getByLabelText(/select language/i);
    expect(languageSelector).toBeInTheDocument();
  });

  it('should render register link when not authenticated', () => {
    renderWithProviders(<Header />);
    
    const registerLink = screen.getByRole('link', { name: /register/i });
    expect(registerLink).toBeInTheDocument();
    expect(registerLink).toHaveAttribute('href', '/register');
  });

  it('should show mobile menu toggle button when not authenticated', () => {
    renderWithProviders(<Header />);
    
    const menuToggle = screen.getByRole('button', { name: /toggle menu/i });
    expect(menuToggle).toBeInTheDocument();
  });

  it('should toggle mobile menu when button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Header />);
    
    const menuToggle = screen.getByRole('button', { name: /toggle menu/i });
    expect(screen.getAllByRole('link', { name: /register/i })).toHaveLength(1);
    await user.click(menuToggle);
    
    await waitFor(() => {
      expect(screen.getAllByRole('link', { name: /register/i })).toHaveLength(2);
    });
  });

  it('should render search bar and account buttons when authenticated', () => {
    mockUseAuthStore.mockReturnValue({
      isAuthenticated: true,
      login: mockLogin,
      logout: mockLogout,
      user: { id: '1', email: 'test@example.com' },
    } as any);

    renderWithProviders(<Header />);
    
    expect(screen.getAllByPlaceholderText(/search/i).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /my account/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
  });

  it('should call login and navigate when sign in is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Header />);
    
    const signInButton = screen.getByRole('button', { name: /sign in/i });
    await user.click(signInButton);
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('should call logout and navigate when sign out is clicked', async () => {
    const user = userEvent.setup();
    mockUseAuthStore.mockReturnValue({
      isAuthenticated: true,
      login: mockLogin,
      logout: mockLogout,
      user: { id: '1', email: 'test@example.com' },
    } as any);

    renderWithProviders(<Header />);
    
    const signOutButton = screen.getByRole('button', { name: /sign out/i });
    await user.click(signOutButton);
    
    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('should navigate to account page when my account button is clicked', async () => {
    const user = userEvent.setup();
    mockUseAuthStore.mockReturnValue({
      isAuthenticated: true,
      login: mockLogin,
      logout: mockLogout,
      user: { id: '1', email: 'test@example.com' },
    } as any);

    renderWithProviders(<Header />);
    
    const accountButton = screen.getByRole('button', { name: /my account/i });
    await user.click(accountButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/account');
  });

  it('should handle search submission and navigate', async () => {
    const user = userEvent.setup();
    mockUseAuthStore.mockReturnValue({
      isAuthenticated: true,
      login: mockLogin,
      logout: mockLogout,
      user: { id: '1', email: 'test@example.com' },
    } as any);

    renderWithProviders(<Header />);
    
    const [searchInput] = screen.getAllByPlaceholderText(/search/i);
    const [searchButton] = screen.getAllByRole('button', { name: /^search$/i });
    
    await user.type(searchInput, 'test query');
    await user.click(searchButton);
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/search?q=test%20query');
    });
  });

  it('should have proper header styling classes', () => {
    const { container } = renderWithProviders(<Header />);
    const header = container.querySelector('header');
    
    expect(header).toHaveClass('bg-blue', 'text-white', 'sticky', 'top-0', 'z-50', 'shadow-lg');
  });

  it('should show mobile search bar when authenticated', () => {
    mockUseAuthStore.mockReturnValue({
      isAuthenticated: true,
      login: mockLogin,
      logout: mockLogout,
      user: { id: '1', email: 'test@example.com' },
    } as any);

    const { container } = renderWithProviders(<Header />);
    
    const mobileSearchSection = container.querySelector('.md\\:hidden.border-t');
    expect(mobileSearchSection).toBeInTheDocument();
  });
});


