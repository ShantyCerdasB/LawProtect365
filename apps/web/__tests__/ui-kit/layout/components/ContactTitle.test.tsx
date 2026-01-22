// @ts-nocheck
/**
 * @fileoverview Contact Title Component Tests
 * @summary Tests for the ContactTitle component
 */

import { render, screen } from '@testing-library/react';
import { renderWithProviders } from '@/__tests__/helpers';
import { ContactTitle } from '@/ui-kit/layout/components/ContactTitle';

jest.mock('@lawprotect/frontend-core', () => ({
  useTranslation: jest.fn(() => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'footer.contact.title': 'Contact Us',
      };
      return translations[key] || key;
    },
  })),
}));

describe('ContactTitle', () => {
  it('should render contact title', () => {
    renderWithProviders(<ContactTitle />);
    
    expect(screen.getByText('Contact Us')).toBeInTheDocument();
  });

  it('should render title as h3', () => {
    renderWithProviders(<ContactTitle />);
    
    const title = screen.getByText('Contact Us');
    expect(title.tagName).toBe('H3');
    expect(title).toHaveClass('text-white', 'font-bold', 'text-lg', 'mb-4');
  });
});














