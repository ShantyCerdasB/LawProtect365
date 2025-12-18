// @ts-nocheck
/**
 * @fileoverview Phone Icon Component Tests
 * @summary Tests for the PhoneIcon component
 */

import { render } from '@testing-library/react';
import { PhoneIcon } from '@/ui-kit/icons/components/PhoneIcon';

describe('PhoneIcon', () => {
  it('should render phone icon SVG', () => {
    const { container } = render(<PhoneIcon />);
    
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
  });

  it('should have default className', () => {
    const { container } = render(<PhoneIcon />);
    
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('w-4', 'h-4');
  });

  it('should apply custom className', () => {
    const { container } = render(<PhoneIcon className="w-10 h-10" />);
    
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('w-10', 'h-10');
  });

  it('should have proper SVG attributes', () => {
    const { container } = render(<PhoneIcon />);
    
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('fill', 'none');
    expect(svg).toHaveAttribute('stroke', 'currentColor');
  });

  it('should render path elements', () => {
    const { container } = render(<PhoneIcon />);
    
    const paths = container.querySelectorAll('path');
    expect(paths.length).toBeGreaterThan(0);
  });
});



