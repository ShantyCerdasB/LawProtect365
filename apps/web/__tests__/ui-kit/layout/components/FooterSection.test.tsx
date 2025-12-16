// @ts-nocheck
/**
 * @fileoverview Footer Section Component Tests
 * @summary Tests for the FooterSection component
 */

import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/__tests__/helpers';
import { FooterSection } from '@/ui-kit/layout/components/FooterSection';

describe('FooterSection', () => {
  it('should render children content', () => {
    renderWithProviders(
      <FooterSection>
        <div>Test Content</div>
      </FooterSection>
    );
    
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should have centered alignment on mobile', () => {
    const { container } = renderWithProviders(
      <FooterSection>
        <div>Content</div>
      </FooterSection>
    );
    
    const section = container.firstChild as HTMLElement;
    expect(section).toHaveClass('items-center');
  });

  it('should have start alignment on desktop', () => {
    const { container } = renderWithProviders(
      <FooterSection>
        <div>Content</div>
      </FooterSection>
    );
    
    const section = container.firstChild as HTMLElement;
    expect(section).toHaveClass('md:items-start');
  });

  it('should apply custom className', () => {
    const { container } = renderWithProviders(
      <FooterSection className="custom-section">
        <div>Content</div>
      </FooterSection>
    );
    
    const section = container.firstChild as HTMLElement;
    expect(section).toHaveClass('custom-section');
  });

  it('should have flex column layout', () => {
    const { container } = renderWithProviders(
      <FooterSection>
        <div>Content</div>
      </FooterSection>
    );
    
    const section = container.firstChild as HTMLElement;
    expect(section).toHaveClass('flex', 'flex-col');
  });

  it('should render multiple children', () => {
    renderWithProviders(
      <FooterSection>
        <div>First</div>
        <div>Second</div>
        <div>Third</div>
      </FooterSection>
    );
    
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
    expect(screen.getByText('Third')).toBeInTheDocument();
  });

  it('should render empty when no children provided', () => {
    const { container } = renderWithProviders(<FooterSection>{null}</FooterSection>);
    
    const section = container.firstChild as HTMLElement;
    expect(section).toBeInTheDocument();
    expect(section).toBeEmptyDOMElement();
  });
});


