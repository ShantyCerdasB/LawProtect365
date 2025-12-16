// @ts-nocheck
/**
 * @fileoverview Location Icon Component Tests
 * @summary Tests for the LocationIcon component
 */

import { render } from '@testing-library/react';
import { LocationIcon } from '@/ui-kit/icons/components/LocationIcon';

describe('LocationIcon', () => {
  it('should render location icon SVG', () => {
    const { container } = render(<LocationIcon />);
    
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
  });

  it('should have default className', () => {
    const { container } = render(<LocationIcon />);
    
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('w-4', 'h-4');
  });

  it('should apply custom className', () => {
    const { container } = render(<LocationIcon className="w-6 h-6" />);
    
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('w-6', 'h-6');
  });

  it('should have proper SVG attributes', () => {
    const { container } = render(<LocationIcon />);
    
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('fill', 'none');
    expect(svg).toHaveAttribute('stroke', 'currentColor');
  });

  it('should render multiple path elements', () => {
    const { container } = render(<LocationIcon />);
    
    const paths = container.querySelectorAll('path');
    expect(paths.length).toBeGreaterThan(1);
  });
});

