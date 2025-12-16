// @ts-nocheck
/**
 * @fileoverview Auth Guards Tests
 * @summary Tests for the withAuthGuard function
 */

/// <reference types="@testing-library/jest-dom" />
import React from 'react';
import { describe, it, expect } from '@jest/globals';
import { screen } from '@testing-library/react';
import { withAuthGuard } from '@/app/routing/guards';
import { renderWithProviders } from '@/__tests__/helpers';

describe('withAuthGuard', () => {
  const MockComponent = ({ title }: { title: string }) => <div>{title}</div>;

  it('should wrap component with auth guard', () => {
    const GuardedComponent = withAuthGuard(MockComponent);
    
    renderWithProviders(<GuardedComponent title="Test Component" />);
    
    expect(screen.getByText('Test Component')).toBeInTheDocument();
  });

  it('should pass props to wrapped component', () => {
    const GuardedComponent = withAuthGuard(MockComponent);
    
    renderWithProviders(<GuardedComponent title="Prop Test" />);
    
    expect(screen.getByText('Prop Test')).toBeInTheDocument();
  });

  it('should return a component that renders the original component', () => {
    const GuardedComponent = withAuthGuard(MockComponent);
    
    const { container } = renderWithProviders(<GuardedComponent title="Render Test" />);
    
    expect(container.firstChild).toBeInTheDocument();
    expect(screen.getByText('Render Test')).toBeInTheDocument();
  });

  it('should handle component with multiple props', () => {
    const MultiPropComponent = ({ title, subtitle }: { title: string; subtitle: string }) => (
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
    );
    
    const GuardedComponent = withAuthGuard(MultiPropComponent);
    
    renderWithProviders(<GuardedComponent title="Title" subtitle="Subtitle" />);
    
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Subtitle')).toBeInTheDocument();
  });

  it('should handle component with no props', () => {
    const NoPropComponent = () => <div>No Props</div>;
    const GuardedComponent = withAuthGuard(NoPropComponent);
    
    renderWithProviders(<GuardedComponent />);
    
    expect(screen.getByText('No Props')).toBeInTheDocument();
  });

  it('should handle empty props object', () => {
    const GuardedComponent = withAuthGuard(MockComponent);
    
    renderWithProviders(<GuardedComponent title="Empty Props Test" />);
    
    expect(screen.getByText('Empty Props Test')).toBeInTheDocument();
  });
});


