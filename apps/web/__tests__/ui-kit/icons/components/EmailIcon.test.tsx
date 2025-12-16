// @ts-nocheck
/**
 * @fileoverview Email Icon Component Tests
 * @summary Tests for the EmailIcon component
 */

import { render } from '@testing-library/react';
import { EmailIcon } from '@/ui-kit/icons/components/EmailIcon';

describe('EmailIcon', () => {
  it('should render email icon SVG', () => {
    const { container } = render(<EmailIcon />);
    
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
  });

  it('should have default className', () => {
    const { container } = render(<EmailIcon />);
    
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('w-4', 'h-4');
  });

  it('should apply custom className', () => {
    const { container } = render(<EmailIcon className="w-8 h-8" />);
    
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('w-8', 'h-8');
  });

  it('should have proper SVG attributes', () => {
    const { container } = render(<EmailIcon />);
    
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('fill', 'none');
    expect(svg).toHaveAttribute('stroke', 'currentColor');
  });

  it('should render path elements', () => {
    const { container } = render(<EmailIcon />);
    
    const paths = container.querySelectorAll('path');
    expect(paths.length).toBeGreaterThan(0);
  });
});

