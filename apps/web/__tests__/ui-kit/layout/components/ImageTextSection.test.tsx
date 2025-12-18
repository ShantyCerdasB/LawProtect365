// @ts-nocheck
/**
 * @fileoverview Image Text Section Component Tests
 * @summary Tests for the ImageTextSection component
 */

import { render, screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/__tests__/helpers';
import { ImageTextSection } from '@/ui-kit/layout/components/ImageTextSection';

describe('ImageTextSection', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  it('should render image text section with children', () => {
    renderWithProviders(
      <ImageTextSection imageSrc="/test.jpg" imageAlt="Test image">
        <div>Section content</div>
      </ImageTextSection>
    );
    
    expect(screen.getByText('Section content')).toBeInTheDocument();
  });

  it('should render image with alt text', () => {
    renderWithProviders(
      <ImageTextSection imageSrc="/test.jpg" imageAlt="Test image">
        <div>Content</div>
      </ImageTextSection>
    );
    
    const img = screen.getByAltText('Test image');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/test.jpg');
    expect(img).toHaveClass('sr-only');
  });

  it('should have background image style', () => {
    const { container } = renderWithProviders(
      <ImageTextSection imageSrc="/test.jpg" imageAlt="Test">
        <div>Content</div>
      </ImageTextSection>
    );
    
    const section = container.firstChild as HTMLElement;
    expect(section).toHaveStyle({ backgroundImage: 'url(/test.jpg)' });
  });

  it('should apply custom className', () => {
    const { container } = renderWithProviders(
      <ImageTextSection imageSrc="/test.jpg" imageAlt="Test" className="custom-class">
        <div>Content</div>
      </ImageTextSection>
    );
    
    const section = container.firstChild as HTMLElement;
    expect(section).toHaveClass('custom-class');
  });

  it('should have proper container classes', () => {
    const { container } = renderWithProviders(
      <ImageTextSection imageSrc="/test.jpg" imageAlt="Test">
        <div>Content</div>
      </ImageTextSection>
    );
    
    const section = container.firstChild as HTMLElement;
    expect(section).toHaveClass(
      'w-full',
      'relative',
      'h-64',
      'md:h-300',
      'lg:h-300',
      'bg-cover',
      'bg-no-repeat'
    );
  });

  it('should update background position on resize', async () => {
    const { container, rerender } = renderWithProviders(
      <ImageTextSection imageSrc="/test.jpg" imageAlt="Test">
        <div>Content</div>
      </ImageTextSection>
    );
    
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 500,
    });
    
    window.dispatchEvent(new Event('resize'));
    
    await waitFor(() => {
      const section = container.firstChild as HTMLElement;
      expect(section.style.backgroundPosition).toContain('center');
    });
  });

  it('should clean up resize listener on unmount', () => {
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
    
    const { unmount } = renderWithProviders(
      <ImageTextSection imageSrc="/test.jpg" imageAlt="Test">
        <div>Content</div>
      </ImageTextSection>
    );
    
    unmount();
    
    expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    
    removeEventListenerSpy.mockRestore();
  });

  it('should render children in content container', () => {
    renderWithProviders(
      <ImageTextSection imageSrc="/test.jpg" imageAlt="Test">
        <div>First child</div>
        <div>Second child</div>
      </ImageTextSection>
    );
    
    expect(screen.getByText('First child')).toBeInTheDocument();
    expect(screen.getByText('Second child')).toBeInTheDocument();
  });
});




