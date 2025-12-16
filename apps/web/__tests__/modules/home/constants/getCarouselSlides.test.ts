/**
 * @fileoverview Get Carousel Slides Tests
 * @summary Tests for the getCarouselSlides function
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import type { TFunction } from 'i18next';
import { getCarouselSlides } from '@/modules/home/constants/getCarouselSlides';

describe('getCarouselSlides', () => {
  const mockT = jest.fn((key: string) => key) as unknown as TFunction;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return array of carousel slides', () => {
    const slides = getCarouselSlides(mockT);
    
    expect(Array.isArray(slides)).toBe(true);
    expect(slides.length).toBe(4);
  });

  it('should return slides with correct structure', () => {
    const slides = getCarouselSlides(mockT);
    
    slides.forEach((slide) => {
      expect(slide).toHaveProperty('imageSrc');
      expect(slide).toHaveProperty('imageAlt');
      expect(slide).toHaveProperty('title');
      expect(slide).toHaveProperty('description');
      expect(slide).toHaveProperty('buttons');
      expect(Array.isArray(slide.buttons)).toBe(true);
    });
  });

  it('should call translation function for slide titles', () => {
    getCarouselSlides(mockT);
    
    expect(mockT).toHaveBeenCalledWith('home.carousel.slides.0.title');
    expect(mockT).toHaveBeenCalledWith('home.carousel.slides.1.title');
    expect(mockT).toHaveBeenCalledWith('home.carousel.slides.2.title');
    expect(mockT).toHaveBeenCalledWith('home.carousel.slides.3.title');
  });

  it('should call translation function for slide descriptions', () => {
    getCarouselSlides(mockT);
    
    expect(mockT).toHaveBeenCalledWith('home.carousel.slides.0.description');
    expect(mockT).toHaveBeenCalledWith('home.carousel.slides.1.description');
    expect(mockT).toHaveBeenCalledWith('home.carousel.slides.2.description');
    expect(mockT).toHaveBeenCalledWith('home.carousel.slides.3.description');
  });

  it('should call translation function for button labels', () => {
    getCarouselSlides(mockT);
    
    expect(mockT).toHaveBeenCalledWith('home.carousel.buttons.learnMore');
    expect(mockT).toHaveBeenCalledWith('home.carousel.buttons.startToday');
  });

  it('should return correct image sources', () => {
    const slides = getCarouselSlides(mockT);
    
    expect(slides[0].imageSrc).toBe('/Carrusel1.jpg');
    expect(slides[1].imageSrc).toBe('/Carrusel2.jpg');
    expect(slides[2].imageSrc).toBe('/Carrusel3.jpg');
    expect(slides[3].imageSrc).toBe('/Carruse4.jpg');
  });

  it('should return correct image alt texts', () => {
    const slides = getCarouselSlides(mockT);
    
    expect(slides[0].imageAlt).toBe('Justice for all');
    expect(slides[1].imageAlt).toBe('Promote equal access nation wide');
    expect(slides[2].imageAlt).toBe('Enhance consumer and environment protection');
    expect(slides[3].imageAlt).toBe('Strengthen public trust in justice');
  });

  it('should return buttons with correct variants', () => {
    const slides = getCarouselSlides(mockT);
    
    slides.forEach((slide) => {
      if (slide.buttons) {
        expect(slide.buttons).toHaveLength(2);
        expect(slide.buttons[0].variant).toBe('primary');
        expect(slide.buttons[1].variant).toBe('secondary');
      }
    });
  });

  it('should use translation function return values', () => {
    const translatedTitle = 'Translated Title';
    const translatedDescription = 'Translated Description';
    const translatedButton = 'Translated Button';
    
    const mockTImpl = mockT as unknown as jest.Mock;
    mockTImpl.mockImplementation((key: unknown) => {
      const keyStr = typeof key === 'string' ? key : String(key);
      if (keyStr.includes('title')) return translatedTitle;
      if (keyStr.includes('description')) return translatedDescription;
      if (keyStr.includes('button')) return translatedButton;
      return keyStr;
    });
    
    const slides = getCarouselSlides(mockT);
    
    expect(slides[0].title).toBe(translatedTitle);
    expect(slides[0].description).toBe(translatedDescription);
    expect(slides[0].buttons?.[0]?.label).toBe(translatedButton);
  });
});


