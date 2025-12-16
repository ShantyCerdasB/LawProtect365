// @ts-nocheck
/**
 * @fileoverview Navigation Menu Component Tests
 * @summary Tests for the NavigationMenu component
 */

import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/__tests__/helpers';
import { NavigationMenu } from '@/ui-kit/layout/components/NavigationMenu';
import { createMenuItemConfig } from '@/__tests__/helpers/factories/componentFactories';

describe('NavigationMenu', () => {
  const menuItems = [
    createMenuItemConfig({ id: '1', label: 'Home', path: '/' }),
    createMenuItemConfig({ id: '2', label: 'About', path: '/about' }),
    createMenuItemConfig({ id: '3', label: 'Services', path: '/services' }),
  ];

  it('should render navigation menu with items', () => {
    renderWithProviders(<NavigationMenu items={menuItems} />);
    
    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'About' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Services' })).toBeInTheDocument();
  });

  it('should render items as links with correct paths', () => {
    renderWithProviders(<NavigationMenu items={menuItems} />);
    
    const homeLink = screen.getByRole('link', { name: 'Home' });
    expect(homeLink).toHaveAttribute('href', '/');
    
    const aboutLink = screen.getByRole('link', { name: 'About' });
    expect(aboutLink).toHaveAttribute('href', '/about');
  });

  it('should apply custom className to nav element', () => {
    const { container } = renderWithProviders(<NavigationMenu items={menuItems} className="custom-nav" />);
    const nav = container.querySelector('nav');
    
    expect(nav).toHaveClass('custom-nav');
  });

  it('should render items in row layout by default', () => {
    const { container } = renderWithProviders(<NavigationMenu items={menuItems} />);
    const ul = container.querySelector('ul');
    
    expect(ul).toHaveClass('flex-row');
  });

  it('should render items in column layout when className includes flex-col', () => {
    const { container } = renderWithProviders(<NavigationMenu items={menuItems} className="flex-col" />);
    const ul = container.querySelector('ul');
    
    expect(ul).toHaveClass('flex-col');
    expect(ul).not.toHaveClass('flex-row');
  });

  it('should apply custom itemClassName to links', () => {
    renderWithProviders(<NavigationMenu items={menuItems} itemClassName="custom-link" />);
    
    const links = screen.getAllByRole('link');
    links.forEach((link) => {
      expect(link).toHaveClass('custom-link');
    });
  });

  it('should render empty menu when no items provided', () => {
    renderWithProviders(<NavigationMenu items={[]} />);
    
    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.queryAllByRole('link')).toHaveLength(0);
  });

  it('should have proper link styling classes', () => {
    renderWithProviders(<NavigationMenu items={menuItems} />);
    
    const homeLink = screen.getByRole('link', { name: 'Home' });
    expect(homeLink).toHaveClass('text-white', 'text-lg', 'md:text-xl');
  });

  it('should render menu with proper spacing', () => {
    const { container } = renderWithProviders(<NavigationMenu items={menuItems} />);
    const ul = container.querySelector('ul');
    
    expect(ul).toHaveClass('gap-4', 'md:gap-6');
  });

  it('should use item id as key for list items', () => {
    const { container } = renderWithProviders(<NavigationMenu items={menuItems} />);
    const listItems = container.querySelectorAll('li');
    
    expect(listItems).toHaveLength(3);
  });
});

