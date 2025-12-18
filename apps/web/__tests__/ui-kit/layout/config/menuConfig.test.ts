/**
 * @fileoverview Menu Config Tests
 * @summary Tests for the menuConfig constant
 */

import { describe, it, expect } from '@jest/globals';
import { menuConfig } from '@/ui-kit/layout/config/menuConfig';
import { MenuItem } from '@/ui-kit/layout/enums/MenuItem';

describe('menuConfig', () => {
  it('should export menu configuration array', () => {
    expect(Array.isArray(menuConfig)).toBe(true);
    expect(menuConfig.length).toBeGreaterThan(0);
  });

  it('should have all required menu items', () => {
    const itemIds = menuConfig.map((item) => item.id);
    
    expect(itemIds).toContain(MenuItem.Home);
    expect(itemIds).toContain(MenuItem.OurServices);
    expect(itemIds).toContain(MenuItem.Membership);
    expect(itemIds).toContain(MenuItem.Sign365);
    expect(itemIds).toContain(MenuItem.Contact);
  });

  it('should have correct structure for each menu item', () => {
    menuConfig.forEach((item) => {
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('label');
      expect(item).toHaveProperty('path');
      expect(item).toHaveProperty('requiresAuth');
      expect(item).toHaveProperty('showWhenLoggedIn');
      expect(item).toHaveProperty('showWhenLoggedOut');
    });
  });

  it('should have Home menu item with correct values', () => {
    const homeItem = menuConfig.find((item) => item.id === MenuItem.Home);
    
    expect(homeItem).toBeDefined();
    expect(homeItem?.label).toBe('HOME');
    expect(homeItem?.path).toBe('/');
    expect(homeItem?.requiresAuth).toBe(false);
    expect(homeItem?.showWhenLoggedIn).toBe(false);
    expect(homeItem?.showWhenLoggedOut).toBe(true);
  });

  it('should have OurServices menu item with correct values', () => {
    const item = menuConfig.find((item) => item.id === MenuItem.OurServices);
    
    expect(item).toBeDefined();
    expect(item?.label).toBe('OUR SERVICES');
    expect(item?.path).toBe('/our-services');
  });

  it('should have Membership menu item with correct values', () => {
    const item = menuConfig.find((item) => item.id === MenuItem.Membership);
    
    expect(item).toBeDefined();
    expect(item?.label).toBe('MEMBERSHIP');
    expect(item?.path).toBe('/membership');
  });

  it('should have Sign365 menu item with correct values', () => {
    const item = menuConfig.find((item) => item.id === MenuItem.Sign365);
    
    expect(item).toBeDefined();
    expect(item?.label).toBe('SIGN 365');
    expect(item?.path).toBe('/sign-365');
  });

  it('should have Contact menu item with correct values', () => {
    const item = menuConfig.find((item) => item.id === MenuItem.Contact);
    
    expect(item).toBeDefined();
    expect(item?.label).toBe('CONTACT');
    expect(item?.path).toBe('/contact');
  });

  it('should have all items with requiresAuth false', () => {
    menuConfig.forEach((item) => {
      expect(item.requiresAuth).toBe(false);
    });
  });

  it('should have all items with showWhenLoggedOut true', () => {
    menuConfig.forEach((item) => {
      expect(item.showWhenLoggedOut).toBe(true);
    });
  });

  it('should have all items with showWhenLoggedIn false', () => {
    menuConfig.forEach((item) => {
      expect(item.showWhenLoggedIn).toBe(false);
    });
  });
});




