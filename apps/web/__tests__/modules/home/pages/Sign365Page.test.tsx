// @ts-nocheck
/**
 * @fileoverview Sign365 Page Component Tests
 * @summary Tests for the Sign365Page component
 */

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/__tests__/helpers';
import { Sign365Page } from '@/modules/home/pages/Sign365Page';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('Sign365Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render sign365 page', () => {
    renderWithProviders(<Sign365Page />);
    
    expect(screen.getByText(/sign 365/i)).toBeInTheDocument();
  });

  it('should render hero section', () => {
    renderWithProviders(<Sign365Page />);
    
    const heroTitle = screen.getByText(/electronic signature/i);
    expect(heroTitle).toBeInTheDocument();
  });

  it('should render step cards', () => {
    renderWithProviders(<Sign365Page />);
    
    const stepCards = screen.getAllByText(/document|sign|download/i);
    expect(stepCards.length).toBeGreaterThan(0);
  });

  it('should render upload document step', () => {
    renderWithProviders(<Sign365Page />);
    
    const matches = screen.getAllByText(/upload|add.*document/i);
    expect(matches.length).toBeGreaterThan(0);
  });

  it('should render sign document step', () => {
    renderWithProviders(<Sign365Page />);
    
    const matches = screen.getAllByText(/sign.*document/i);
    expect(matches.length).toBeGreaterThan(0);
  });

  it('should render download document step', () => {
    renderWithProviders(<Sign365Page />);
    
    expect(screen.getByText(/download|save/i)).toBeInTheDocument();
  });

  it('should render start signing button', () => {
    renderWithProviders(<Sign365Page />);
    
    const button = screen.getByRole('button', { name: /start.*sign/i });
    expect(button).toBeInTheDocument();
  });

  it('should navigate to documents page when start signing button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Sign365Page />);
    
    const button = screen.getByRole('button', { name: /start.*sign/i });
    await user.click(button);
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/documents');
    });
  });

  it('should render connecting arrows between steps', () => {
    const { container } = renderWithProviders(<Sign365Page />);
    
    const decorativeLines = container.querySelector('img[alt="Decorative lines"]');
    expect(decorativeLines).toBeInTheDocument();
  });

  it('should have proper page container styling', () => {
    const { container } = renderWithProviders(<Sign365Page />);
    
    const pageContainer = container.querySelector('.min-h-screen');
    expect(pageContainer).toBeInTheDocument();
    expect(pageContainer).toHaveClass('bg-white', 'py-12');
  });

  it('should render step icons', () => {
    renderWithProviders(<Sign365Page />);
    
    const uploadIcon = screen.getByAltText(/upload/i);
    expect(uploadIcon).toBeInTheDocument();
  });
});


