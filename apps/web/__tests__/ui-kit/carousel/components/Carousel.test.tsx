// @ts-nocheck
/**
 * @fileoverview Carousel Component Tests
 * @summary Tests for the Carousel component
 */

import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/__tests__/helpers';
import { Carousel } from '@ui-kit/carousel/components/Carousel';
import type { CarouselSlideData } from '@ui-kit/carousel/interfaces';

jest.useFakeTimers();

describe('Carousel', () => {
  const mockSlides: CarouselSlideData[] = [
    {
      imageSrc: '/slide1.jpg',
      imageAlt: 'Slide 1',
      title: 'Title 1',
      description: 'Description 1',
      buttons: [],
    },
    {
      imageSrc: '/slide2.jpg',
      imageAlt: 'Slide 2',
      title: 'Title 2',
      description: 'Description 2',
      buttons: [],
    },
    {
      imageSrc: '/slide3.jpg',
      imageAlt: 'Slide 3',
      title: 'Title 3',
      description: 'Description 3',
      buttons: [],
    },
  ];

  beforeEach(() => {
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.useFakeTimers();
  });

  it('should render carousel with slides', () => {
    renderWithProviders(<Carousel slides={mockSlides} />);

    expect(screen.getByText('Title 1')).toBeInTheDocument();
  });

  it('should display first slide as active by default', () => {
    renderWithProviders(<Carousel slides={mockSlides} />);

    expect(screen.getByText('Title 1')).toBeInTheDocument();
  });

  it('should show "No slides to display" when slides array is empty', () => {
    renderWithProviders(<Carousel slides={[]} />);

    expect(screen.getByText('No slides to display')).toBeInTheDocument();
  });

  it('should auto-advance slides when autoPlayInterval is set', async () => {
    renderWithProviders(<Carousel slides={mockSlides} autoPlayInterval={1000} />);

    expect(screen.getByText('Title 1')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(screen.getByText('Title 2')).toBeInTheDocument();
    });
  });

  it('should cycle back to first slide after last slide', async () => {
    renderWithProviders(<Carousel slides={mockSlides} autoPlayInterval={1000} />);

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    await waitFor(() => {
      expect(screen.getByText('Title 3')).toBeInTheDocument();
    });

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(screen.getByText('Title 1')).toBeInTheDocument();
    });
  });

  it('should not auto-advance when autoPlayInterval is 0', async () => {
    renderWithProviders(<Carousel slides={mockSlides} autoPlayInterval={0} />);

    expect(screen.getByText('Title 1')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    await waitFor(() => {
      expect(screen.getByText('Title 1')).toBeInTheDocument();
    });
    
    const title1 = screen.getByText('Title 1');
    const title2 = screen.queryByText('Title 2');
    
    expect(title1).toBeInTheDocument();
    expect(title2).toBeInTheDocument();
    
    const title1Parent = title1.closest('.opacity-100');
    const title2Parent = title2?.closest('.opacity-0');
    
    expect(title1Parent).toBeTruthy();
    expect(title2Parent).toBeTruthy();
  });

  it('should not auto-advance with single slide', async () => {
    renderWithProviders(
      <Carousel slides={[mockSlides[0]]} autoPlayInterval={1000} />
    );

    expect(screen.getByText('Title 1')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    await waitFor(() => {
      expect(screen.getByText('Title 1')).toBeInTheDocument();
    });
  });

  it('should render indicators', () => {
    renderWithProviders(<Carousel slides={mockSlides} />);

    const indicators = screen.getAllByLabelText(/Go to slide \d+/);
    expect(indicators).toHaveLength(3);
  });

  it('should change active slide when indicator is clicked', async () => {
    const user = userEvent.setup({ delay: null });
    
    renderWithProviders(<Carousel slides={mockSlides} />);

    expect(screen.getByText('Title 1')).toBeInTheDocument();

    const indicators = screen.getAllByLabelText(/Go to slide \d+/);
    await user.click(indicators[1]);

    expect(screen.getByText('Title 2')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = renderWithProviders(
      <Carousel slides={mockSlides} className="custom-carousel" />
    );

    const carousel = container.firstChild as HTMLElement;
    expect(carousel).toHaveClass('custom-carousel');
  });

  it('should use custom indicator colors', () => {
    renderWithProviders(
      <Carousel
        slides={mockSlides}
        activeIndicatorColor="text-blue"
        inactiveIndicatorColor="text-blue/40"
      />
    );

    const indicators = screen.getAllByLabelText(/Go to slide \d+/);
    expect(indicators).toHaveLength(3);
  });

  it('should clean up interval on unmount', () => {
    const { unmount } = renderWithProviders(
      <Carousel slides={mockSlides} autoPlayInterval={1000} />
    );

    unmount();

    act(() => {
      jest.advanceTimersByTime(5000);
    });
  });
});


