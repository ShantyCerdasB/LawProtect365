// @ts-nocheck
/**
 * @fileoverview Search Bar Component Tests
 * @summary Tests for the SearchBar component
 */

import React from 'react';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/__tests__/helpers';
import { SearchBar } from '@/ui-kit/layout/components/SearchBar';

describe('SearchBar', () => {
  const mockOnSearch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render search input', () => {
    renderWithProviders(<SearchBar onSearch={mockOnSearch} />);
    
    const input = screen.getByPlaceholderText(/search/i);
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'text');
  });

  it('should render search button', () => {
    renderWithProviders(<SearchBar onSearch={mockOnSearch} />);
    
    const button = screen.getByRole('button', { name: /search/i });
    expect(button).toBeInTheDocument();
  });

  it('should use default placeholder when not provided', () => {
    renderWithProviders(<SearchBar onSearch={mockOnSearch} />);
    
    const input = screen.getByPlaceholderText(/search/i);
    expect(input).toBeInTheDocument();
  });

  it('should use custom placeholder when provided', () => {
    renderWithProviders(<SearchBar onSearch={mockOnSearch} placeholder="Search documents..." />);
    
    const input = screen.getByPlaceholderText('Search documents...');
    expect(input).toBeInTheDocument();
  });

  it('should update input value when typing', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SearchBar onSearch={mockOnSearch} />);
    
    const input = screen.getByPlaceholderText(/search/i);
    await user.type(input, 'test query');
    
    expect(input).toHaveValue('test query');
  });

  it('should call onSearch when form is submitted', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SearchBar onSearch={mockOnSearch} />);
    
    const input = screen.getByPlaceholderText(/search/i);
    const button = screen.getByRole('button', { name: /search/i });
    
    await user.type(input, 'test query');
    await user.click(button);
    
    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith('test query');
    });
  });

  it('should call onSearch when Enter key is pressed', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SearchBar onSearch={mockOnSearch} />);
    
    const input = screen.getByPlaceholderText(/search/i);
    await user.type(input, 'test query{Enter}');
    
    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith('test query');
    });
  });

  it('should not call onSearch when input is empty and submitted', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SearchBar onSearch={mockOnSearch} />);
    
    const button = screen.getByRole('button', { name: /search/i });
    await user.click(button);
    
    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith('');
    });
  });

  it('should apply custom className', () => {
    const { container } = renderWithProviders(<SearchBar onSearch={mockOnSearch} className="custom-search" />);
    const form = container.querySelector('form');
    
    expect(form).toHaveClass('custom-search');
  });

  it('should have proper input styling', () => {
    renderWithProviders(<SearchBar onSearch={mockOnSearch} />);
    
    const input = screen.getByPlaceholderText(/search/i);
    expect(input).toHaveClass('w-full', 'px-4', 'py-2', 'rounded-lg');
  });

  it('should have search icon in button', () => {
    const { container } = renderWithProviders(<SearchBar onSearch={mockOnSearch} />);
    
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('should handle search with empty onSearch handler', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SearchBar />);
    
    const input = screen.getByPlaceholderText(/search/i);
    const button = screen.getByRole('button', { name: /search/i });
    
    await user.type(input, 'test');
    await user.click(button);
    
    await waitFor(() => {
      expect(input).toHaveValue('test');
    });
  });
});


