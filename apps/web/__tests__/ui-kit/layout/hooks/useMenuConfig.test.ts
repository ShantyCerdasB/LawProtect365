/**
 * @fileoverview Use Menu Config Hook Tests
 * @summary Tests for the useMenuConfig hook
 */

import { renderHook } from '@testing-library/react';
import { useMenuConfig } from '@/ui-kit/layout/hooks/useMenuConfig';
import { MenuItem } from '@/ui-kit/layout/enums/MenuItem';
import { createAppWrapper } from '@/__tests__/helpers';

jest.mock('@lawprotect/frontend-core', () => ({
  useTranslation: jest.fn(() => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'menu.home': 'Home',
        'menu.ourServices': 'Our Services',
        'menu.membership': 'Membership',
        'menu.sign365': 'Sign365',
        'menu.contact': 'Contact',
      };
      return translations[key] || key;
    },
  })),
}));

describe('useMenuConfig', () => {
  it('should return menu configuration with translated labels', () => {
    const wrapper = createAppWrapper();
    const { result } = renderHook(() => useMenuConfig(), { wrapper });

    expect(result.current).toHaveLength(5);
    expect(result.current[0].label).toBe('Home');
    expect(result.current[1].label).toBe('Our Services');
    expect(result.current[2].label).toBe('Membership');
    expect(result.current[3].label).toBe('Sign365');
    expect(result.current[4].label).toBe('Contact');
  });

  it('should return menu items with correct structure', () => {
    const wrapper = createAppWrapper();
    const { result } = renderHook(() => useMenuConfig(), { wrapper });

    const homeItem = result.current[0];
    expect(homeItem).toHaveProperty('id');
    expect(homeItem).toHaveProperty('label');
    expect(homeItem).toHaveProperty('path');
    expect(homeItem).toHaveProperty('requiresAuth');
    expect(homeItem).toHaveProperty('showWhenLoggedIn');
    expect(homeItem).toHaveProperty('showWhenLoggedOut');
  });

  it('should return Home menu item with correct values', () => {
    const wrapper = createAppWrapper();
    const { result } = renderHook(() => useMenuConfig(), { wrapper });

    const homeItem = result.current.find((item) => item.id === MenuItem.Home);
    expect(homeItem).toBeDefined();
    expect(homeItem?.label).toBe('Home');
    expect(homeItem?.path).toBe('/');
    expect(homeItem?.requiresAuth).toBe(false);
    expect(homeItem?.showWhenLoggedIn).toBe(false);
    expect(homeItem?.showWhenLoggedOut).toBe(true);
  });

  it('should return OurServices menu item with correct values', () => {
    const wrapper = createAppWrapper();
    const { result } = renderHook(() => useMenuConfig(), { wrapper });

    const item = result.current.find((item) => item.id === MenuItem.OurServices);
    expect(item).toBeDefined();
    expect(item?.path).toBe('/our-services');
    expect(item?.requiresAuth).toBe(false);
  });

  it('should return Membership menu item with correct values', () => {
    const wrapper = createAppWrapper();
    const { result } = renderHook(() => useMenuConfig(), { wrapper });

    const item = result.current.find((item) => item.id === MenuItem.Membership);
    expect(item).toBeDefined();
    expect(item?.path).toBe('/membership');
    expect(item?.requiresAuth).toBe(false);
  });

  it('should return Sign365 menu item with correct values', () => {
    const wrapper = createAppWrapper();
    const { result } = renderHook(() => useMenuConfig(), { wrapper });

    const item = result.current.find((item) => item.id === MenuItem.Sign365);
    expect(item).toBeDefined();
    expect(item?.path).toBe('/sign-365');
    expect(item?.requiresAuth).toBe(false);
  });

  it('should return Contact menu item with correct values', () => {
    const wrapper = createAppWrapper();
    const { result } = renderHook(() => useMenuConfig(), { wrapper });

    const item = result.current.find((item) => item.id === MenuItem.Contact);
    expect(item).toBeDefined();
    expect(item?.path).toBe('/contact');
    expect(item?.requiresAuth).toBe(false);
  });

  it('should return all items with showWhenLoggedOut true', () => {
    const wrapper = createAppWrapper();
    const { result } = renderHook(() => useMenuConfig(), { wrapper });

    result.current.forEach((item) => {
      expect(item.showWhenLoggedOut).toBe(true);
    });
  });

  it('should return all items with showWhenLoggedIn false', () => {
    const wrapper = createAppWrapper();
    const { result } = renderHook(() => useMenuConfig(), { wrapper });

    result.current.forEach((item) => {
      expect(item.showWhenLoggedIn).toBe(false);
    });
  });

  it('should return all items with requiresAuth false', () => {
    const wrapper = createAppWrapper();
    const { result } = renderHook(() => useMenuConfig(), { wrapper });

    result.current.forEach((item) => {
      expect(item.requiresAuth).toBe(false);
    });
  });
});

