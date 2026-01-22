// @ts-nocheck
/**
 * @fileoverview Section Component Tests
 * @summary Tests for the Section component
 */

/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { renderWithProviders } from '@/__tests__/helpers';
import { Section } from '@/ui-kit/layout/Section';

describe('Section', () => {
  it('should render section with children', () => {
    renderWithProviders(
      <Section>
        <div>Section content</div>
      </Section>
    );
    
    expect(screen.getByText('Section content')).toBeInTheDocument();
  });

  it('should render section with title', () => {
    renderWithProviders(
      <Section title="Section Title">
        <div>Content</div>
      </Section>
    );
    
    expect(screen.getByText('Section Title')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('should render section with actions', () => {
    renderWithProviders(
      <Section actions={<button>Action Button</button>}>
        <div>Content</div>
      </Section>
    );
    
    expect(screen.getByText('Action Button')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('should render section with title and actions', () => {
    renderWithProviders(
      <Section title="Section Title" actions={<button>Action</button>}>
        <div>Content</div>
      </Section>
    );
    
    expect(screen.getByText('Section Title')).toBeInTheDocument();
    expect(screen.getByText('Action')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('should not render header when title and actions are missing', () => {
    const { container } = renderWithProviders(
      <Section>
        <div>Content</div>
      </Section>
    );
    
    const header = container.querySelector('.flex.items-center.justify-between');
    expect(header).not.toBeInTheDocument();
  });

  it('should have proper styling classes', () => {
    const { container } = renderWithProviders(
      <Section title="Title">
        <div>Content</div>
      </Section>
    );
    
    const section = container.firstChild as HTMLElement;
    expect(section).toHaveClass('bg-white', 'rounded', 'shadow-sm', 'p-4', 'space-y-2');
  });

  it('should render title with proper styling', () => {
    renderWithProviders(
      <Section title="Section Title">
        <div>Content</div>
      </Section>
    );
    
    const title = screen.getByText('Section Title');
    expect(title.tagName).toBe('H3');
    expect(title).toHaveClass('text-lg', 'font-semibold');
  });

  it('should render ReactNode title', () => {
    renderWithProviders(
      <Section title={<span>Custom Title</span>}>
        <div>Content</div>
      </Section>
    );
    
    expect(screen.getByText('Custom Title')).toBeInTheDocument();
  });

  it('should render ReactNode actions', () => {
    renderWithProviders(
      <Section actions={<div>Custom Actions</div>}>
        <div>Content</div>
      </Section>
    );
    
    expect(screen.getByText('Custom Actions')).toBeInTheDocument();
  });
});















