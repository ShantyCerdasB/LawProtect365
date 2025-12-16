// @ts-nocheck
/**
 * @fileoverview PageLayout Component Tests
 * @summary Tests for the PageLayout component
 */

/// <reference types="@testing-library/jest-dom" />
import '@testing-library/jest-dom';
import React from 'react';
import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { renderWithProviders } from '@/__tests__/helpers';
import { PageLayout } from '@/ui-kit/layout/PageLayout';

describe('PageLayout', () => {
  it('should render page layout with children', () => {
    renderWithProviders(
      <PageLayout>
        <div>Page content</div>
      </PageLayout>
    );
    
    expect(screen.getByText('Page content')).toBeInTheDocument();
  });

  it('should render page layout with title', () => {
    renderWithProviders(
      <PageLayout title="Page Title">
        <div>Page content</div>
      </PageLayout>
    );
    
    expect(screen.getByText('Page Title')).toBeInTheDocument();
    expect(screen.getByText('Page content')).toBeInTheDocument();
  });

  it('should not render header when title is missing', () => {
    const { container } = renderWithProviders(
      <PageLayout>
        <div>Page content</div>
      </PageLayout>
    );
    
    const header = container.querySelector('header');
    expect(header).not.toBeInTheDocument();
  });

  it('should have proper main element structure', () => {
    const { container } = renderWithProviders(
      <PageLayout>
        <div>Content</div>
      </PageLayout>
    );
    
    const main = container.querySelector('main');
    expect(main).toBeInTheDocument();
    expect(main).toHaveClass('p-6', 'space-y-4');
  });

  it('should render title in header element', () => {
    renderWithProviders(
      <PageLayout title="Page Title">
        <div>Content</div>
      </PageLayout>
    );
    
    const header = screen.getByText('Page Title').closest('header');
    expect(header).toBeInTheDocument();
    expect(header).toHaveClass('text-2xl', 'font-semibold');
  });

  it('should render ReactNode title', () => {
    renderWithProviders(
      <PageLayout title={<h1>Custom Title</h1>}>
        <div>Content</div>
      </PageLayout>
    );
    
    expect(screen.getByText('Custom Title')).toBeInTheDocument();
  });

  it('should render multiple children', () => {
    renderWithProviders(
      <PageLayout>
        <div>First child</div>
        <div>Second child</div>
        <div>Third child</div>
      </PageLayout>
    );
    
    expect(screen.getByText('First child')).toBeInTheDocument();
    expect(screen.getByText('Second child')).toBeInTheDocument();
    expect(screen.getByText('Third child')).toBeInTheDocument();
  });
});


