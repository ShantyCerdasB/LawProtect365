// @ts-nocheck
/**
 * @fileoverview Carousel Indicators Component Tests
 * @summary Tests for the CarouselIndicators component
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/__tests__/helpers';
import { CarouselIndicators } from '@ui-kit/carousel/components/CarouselIndicators';

describe('CarouselIndicators', () => {
  const onIndicatorClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render indicators for each slide', () => {
    renderWithProviders(
      <CarouselIndicators
        totalSlides={3}
        activeIndex={0}
        onIndicatorClick={onIndicatorClick}
        activeColor="text-emerald"
        inactiveColor="text-emerald/40"
      />
    );

    const indicators = screen.getAllByRole('button');
    expect(indicators).toHaveLength(3);
  });

  it('should highlight active indicator', () => {
    renderWithProviders(
      <CarouselIndicators
        totalSlides={3}
        activeIndex={1}
        onIndicatorClick={onIndicatorClick}
        activeColor="text-emerald"
        inactiveColor="text-emerald/40"
      />
    );

    const indicators = screen.getAllByRole('button');
    expect(indicators[0]).not.toHaveClass('bg-emerald');
    expect(indicators[1]).toHaveClass('bg-emerald');
    expect(indicators[2]).not.toHaveClass('bg-emerald');
  });

  it('should call onIndicatorClick when indicator is clicked', async () => {
    const user = userEvent.setup();
    
    renderWithProviders(
      <CarouselIndicators
        totalSlides={3}
        activeIndex={0}
        onIndicatorClick={onIndicatorClick}
        activeColor="text-emerald"
        inactiveColor="text-emerald/40"
      />
    );

    const indicators = screen.getAllByRole('button');
    await user.click(indicators[1]);

    expect(onIndicatorClick).toHaveBeenCalledTimes(1);
    expect(onIndicatorClick).toHaveBeenCalledWith(1);
  });

  it('should have proper aria labels', () => {
    renderWithProviders(
      <CarouselIndicators
        totalSlides={3}
        activeIndex={0}
        onIndicatorClick={onIndicatorClick}
        activeColor="text-emerald"
        inactiveColor="text-emerald/40"
      />
    );

    expect(screen.getByLabelText('Go to slide 1')).toBeInTheDocument();
    expect(screen.getByLabelText('Go to slide 2')).toBeInTheDocument();
    expect(screen.getByLabelText('Go to slide 3')).toBeInTheDocument();
  });

  it('should have aria-current on active indicator', () => {
    renderWithProviders(
      <CarouselIndicators
        totalSlides={3}
        activeIndex={1}
        onIndicatorClick={onIndicatorClick}
        activeColor="text-emerald"
        inactiveColor="text-emerald/40"
      />
    );

    const indicators = screen.getAllByRole('button');
    expect(indicators[0]).not.toHaveAttribute('aria-current');
    expect(indicators[1]).toHaveAttribute('aria-current', 'true');
    expect(indicators[2]).not.toHaveAttribute('aria-current');
  });

  it('should render single indicator', () => {
    renderWithProviders(
      <CarouselIndicators
        totalSlides={1}
        activeIndex={0}
        onIndicatorClick={onIndicatorClick}
        activeColor="text-emerald"
        inactiveColor="text-emerald/40"
      />
    );

    const indicators = screen.getAllByRole('button');
    expect(indicators).toHaveLength(1);
  });

  it('should have proper styling classes', () => {
    const { container } = renderWithProviders(
      <CarouselIndicators
        totalSlides={2}
        activeIndex={0}
        onIndicatorClick={onIndicatorClick}
        activeColor="text-emerald"
        inactiveColor="text-emerald/40"
      />
    );

    const containerDiv = container.firstChild as HTMLElement;
    expect(containerDiv).toHaveClass('flex', 'gap-3', 'mb-4');

    const indicators = screen.getAllByRole('button');
    indicators.forEach((indicator) => {
      expect(indicator).toHaveClass('w-3.5', 'h-3.5', 'rounded-full', 'transition-colors');
    });
  });
});



