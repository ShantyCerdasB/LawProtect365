// @ts-nocheck
/**
 * @fileoverview Decorative SVG Component Tests
 * @summary Tests for the DecorativeSVG component
 */

import { render, screen } from '@testing-library/react';
import { renderWithProviders } from '@/__tests__/helpers';
import { DecorativeSVG } from '@/ui-kit/layout/components/DecorativeSVG';

describe('DecorativeSVG', () => {
  it('should render decorative SVG with image', () => {
    renderWithProviders(
      <DecorativeSVG src="/test.svg" alt="Test decorative" />
    );
    
    const img = screen.getByAltText('Test decorative');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/test.svg');
  });

  it('should apply default position classes', () => {
    const { container } = renderWithProviders(
      <DecorativeSVG src="/test.svg" alt="Test" />
    );
    
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('top-0', 'right-0');
  });

  it('should apply position classes for top-left', () => {
    const { container } = renderWithProviders(
      <DecorativeSVG src="/test.svg" alt="Test" position="top-left" />
    );
    
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('top-0', 'left-0');
  });

  it('should apply position classes for bottom-right', () => {
    const { container } = renderWithProviders(
      <DecorativeSVG src="/test.svg" alt="Test" position="bottom-right" />
    );
    
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('bottom-0', 'right-0');
  });

  it('should apply position classes for bottom-left', () => {
    const { container } = renderWithProviders(
      <DecorativeSVG src="/test.svg" alt="Test" position="bottom-left" />
    );
    
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('bottom-0', 'left-0');
  });

  it('should apply default opacity', () => {
    const { container } = renderWithProviders(
      <DecorativeSVG src="/test.svg" alt="Test" />
    );
    
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveStyle({ opacity: '0.6' });
  });

  it('should apply custom opacity', () => {
    const { container } = renderWithProviders(
      <DecorativeSVG src="/test.svg" alt="Test" opacity={80} />
    );
    
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveStyle({ opacity: '0.8' });
  });

  it('should apply default size classes', () => {
    const { container } = renderWithProviders(
      <DecorativeSVG src="/test.svg" alt="Test" />
    );
    
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('w-[600px]', 'h-[600px]', 'md:w-[800px]', 'md:h-[800px]');
  });

  it('should apply custom size', () => {
    const { container } = renderWithProviders(
      <DecorativeSVG src="/test.svg" alt="Test" size="w-400 h-400" />
    );
    
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('w-400', 'h-400');
  });

  it('should apply top offset for top positions', () => {
    const { container } = renderWithProviders(
      <DecorativeSVG src="/test.svg" alt="Test" position="top-right" />
    );
    
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('top-[-50px]', 'md:top-[-100px]');
  });

  it('should apply bottom offset for bottom positions', () => {
    const { container } = renderWithProviders(
      <DecorativeSVG src="/test.svg" alt="Test" position="bottom-right" />
    );
    
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('bottom-[-50px]', 'md:bottom-[-100px]');
  });

  it('should apply custom className', () => {
    const { container } = renderWithProviders(
      <DecorativeSVG src="/test.svg" alt="Test" className="custom-class" />
    );
    
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('custom-class');
  });

  it('should have pointer-events-none and z-0 classes', () => {
    const { container } = renderWithProviders(
      <DecorativeSVG src="/test.svg" alt="Test" />
    );
    
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('pointer-events-none', 'z-0');
  });

  it('should render image with proper classes', () => {
    renderWithProviders(
      <DecorativeSVG src="/test.svg" alt="Test" />
    );
    
    const img = screen.getByAltText('Test');
    expect(img).toHaveClass('w-full', 'h-full', 'object-contain');
  });
});




