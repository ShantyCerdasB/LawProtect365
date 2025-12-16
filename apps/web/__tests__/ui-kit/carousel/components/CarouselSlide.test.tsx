// @ts-nocheck
/**
 * @fileoverview Carousel Slide Component Tests
 * @summary Tests for the CarouselSlide component
 */

import { render, screen } from '@testing-library/react';
import { renderWithProviders } from '@/__tests__/helpers';
import { CarouselSlide } from '@ui-kit/carousel/components/CarouselSlide';
import type { CarouselSlideData } from '@ui-kit/carousel/interfaces';

describe('CarouselSlide', () => {
  const mockSlide: CarouselSlideData = {
    imageSrc: '/test-image.jpg',
    imageAlt: 'Test image',
    title: 'Test Title',
    description: 'Test description',
    buttons: [],
  };

  it('should render slide with image, title and description', () => {
    renderWithProviders(
      <CarouselSlide slide={mockSlide} isActive={true} />
    );

    expect(screen.getByAltText('Test image')).toBeInTheDocument();
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('should render active slide with visible styles', () => {
    const { container } = renderWithProviders(
      <CarouselSlide slide={mockSlide} isActive={true} />
    );

    const slide = container.firstChild as HTMLElement;
    expect(slide).toHaveClass('opacity-100', 'relative');
    expect(slide).not.toHaveClass('opacity-0', 'absolute');
  });

  it('should render inactive slide with hidden styles', () => {
    const { container } = renderWithProviders(
      <CarouselSlide slide={mockSlide} isActive={false} />
    );

    const slide = container.firstChild as HTMLElement;
    expect(slide).toHaveClass('opacity-0', 'absolute', 'inset-0', 'pointer-events-none');
    expect(slide).not.toHaveClass('opacity-100', 'relative');
  });

  it('should render buttons when provided', () => {
    const slideWithButtons: CarouselSlideData = {
      ...mockSlide,
      buttons: [
        { label: 'Button 1', variant: 'primary', href: '/link1' },
        { label: 'Button 2', variant: 'secondary', onClick: jest.fn() },
      ],
    };

    renderWithProviders(
      <CarouselSlide slide={slideWithButtons} isActive={true} />
    );

    expect(screen.getByText('Button 1')).toBeInTheDocument();
    expect(screen.getByText('Button 2')).toBeInTheDocument();
  });

  it('should render link button with href', () => {
    const slideWithLink: CarouselSlideData = {
      ...mockSlide,
      buttons: [{ label: 'Link Button', variant: 'primary', href: '/test' }],
    };

    renderWithProviders(
      <CarouselSlide slide={slideWithLink} isActive={true} />
    );

    const link = screen.getByText('Link Button').closest('a');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/test');
  });

  it('should render button with onClick handler', async () => {
    const onClick = jest.fn();
    const slideWithButton: CarouselSlideData = {
      ...mockSlide,
      buttons: [{ label: 'Click Button', variant: 'primary', onClick }],
    };

    renderWithProviders(
      <CarouselSlide slide={slideWithButton} isActive={true} />
    );

    const button = screen.getByText('Click Button');
    expect(button).toBeInTheDocument();
  });

  it('should render indicators when provided', () => {
    const indicators = <div data-testid="indicators">Indicators</div>;

    renderWithProviders(
      <CarouselSlide slide={mockSlide} isActive={true} indicators={indicators} />
    );

    expect(screen.getByTestId('indicators')).toBeInTheDocument();
  });

  it('should not render indicators section when not provided', () => {
    const { container } = renderWithProviders(
      <CarouselSlide slide={mockSlide} isActive={true} />
    );

    const indicatorsSection = container.querySelector('[data-testid="indicators"]');
    expect(indicatorsSection).not.toBeInTheDocument();
  });

  it('should render slide without buttons', () => {
    renderWithProviders(
      <CarouselSlide slide={mockSlide} isActive={true} />
    );

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = renderWithProviders(
      <CarouselSlide slide={mockSlide} isActive={true} className="custom-class" />
    );

    const slide = container.firstChild as HTMLElement;
    expect(slide).toHaveClass('custom-class');
  });
});

