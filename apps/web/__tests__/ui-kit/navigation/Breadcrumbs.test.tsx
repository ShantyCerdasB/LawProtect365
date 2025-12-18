// @ts-nocheck
/**
 * @fileoverview Breadcrumbs Component Tests
 * @summary Tests for the Breadcrumbs component
 */

import { render, screen } from '@testing-library/react';
import { renderWithProviders } from '@/__tests__/helpers';
import { Breadcrumbs } from '@ui-kit/navigation/Breadcrumbs';

describe('Breadcrumbs', () => {
  it('should render breadcrumbs with items', () => {
    const items = [
      { label: 'Home' },
      { label: 'Documents' },
      { label: 'View' },
    ];
    
    renderWithProviders(<Breadcrumbs items={items} />);
    
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Documents')).toBeInTheDocument();
    expect(screen.getByText('View')).toBeInTheDocument();
  });

  it('should render links for items with href', () => {
    const items = [
      { label: 'Home', href: '/' },
      { label: 'Documents', href: '/documents' },
      { label: 'View' },
    ];
    
    renderWithProviders(<Breadcrumbs items={items} />);
    
    const homeLink = screen.getByText('Home');
    expect(homeLink).toHaveAttribute('href', '/');
    expect(homeLink).toHaveClass('text-blue-600', 'hover:underline');
    
    const documentsLink = screen.getByText('Documents');
    expect(documentsLink).toHaveAttribute('href', '/documents');
    
    const viewLabel = screen.getByText('View');
    expect(viewLabel.tagName).not.toBe('A');
  });

  it('should render separators between items', () => {
    const items = [
      { label: 'Home', href: '/' },
      { label: 'Documents', href: '/documents' },
      { label: 'View' },
    ];
    
    renderWithProviders(<Breadcrumbs items={items} />);
    
    const separators = screen.getAllByText('/');
    expect(separators).toHaveLength(2);
  });

  it('should not render separator after last item', () => {
    const items = [
      { label: 'Home' },
      { label: 'Documents' },
    ];
    
    renderWithProviders(<Breadcrumbs items={items} />);
    
    const separators = screen.getAllByText('/');
    expect(separators).toHaveLength(1);
  });

  it('should render single item without separator', () => {
    const items = [{ label: 'Home' }];
    
    renderWithProviders(<Breadcrumbs items={items} />);
    
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.queryByText('/')).not.toBeInTheDocument();
  });

  it('should render empty breadcrumbs', () => {
    renderWithProviders(<Breadcrumbs items={[]} />);
    
    const nav = screen.getByRole('navigation');
    expect(nav).toBeInTheDocument();
  });

  it('should render ReactNode labels', () => {
    const items = [
      { label: <span>Custom Label</span> },
      { label: 'Text Label' },
    ];
    
    renderWithProviders(<Breadcrumbs items={items} />);
    
    expect(screen.getByText('Custom Label')).toBeInTheDocument();
    expect(screen.getByText('Text Label')).toBeInTheDocument();
  });

  it('should have proper navigation structure', () => {
    const items = [
      { label: 'Home', href: '/' },
      { label: 'Documents' },
    ];
    
    renderWithProviders(<Breadcrumbs items={items} />);
    
    const nav = screen.getByRole('navigation');
    expect(nav).toBeInTheDocument();
    expect(nav.tagName).toBe('NAV');
    
    const list = nav.querySelector('ol');
    expect(list).toBeInTheDocument();
  });
});



