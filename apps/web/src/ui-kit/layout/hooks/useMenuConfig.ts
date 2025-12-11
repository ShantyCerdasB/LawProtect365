/**
 * @fileoverview Use Menu Config - Hook to get translated menu items
 * @summary Returns menu configuration with translated labels
 * @description
 * Uses i18n to translate menu item labels dynamically based on current language.
 */

import { useTranslation } from '@lawprotect/frontend-core';
import { MenuItem } from '../enums/MenuItem';
import type { MenuItemConfig } from '../interfaces/MenuConfigInterfaces';

export function useMenuConfig(): MenuItemConfig[] {
  const { t } = useTranslation('layout');

  return [
    {
      id: MenuItem.Home,
      label: t('menu.home'),
      path: '/',
      requiresAuth: false,
      showWhenLoggedIn: false,
      showWhenLoggedOut: true,
    },
    {
      id: MenuItem.OurServices,
      label: t('menu.ourServices'),
      path: '/services',
      requiresAuth: false,
      showWhenLoggedIn: false,
      showWhenLoggedOut: true,
    },
    {
      id: MenuItem.Membership,
      label: t('menu.membership'),
      path: '/membership',
      requiresAuth: false,
      showWhenLoggedIn: false,
      showWhenLoggedOut: true,
    },
    {
      id: MenuItem.Sign365,
      label: t('menu.sign365'),
      path: '/sign-365',
      requiresAuth: false,
      showWhenLoggedIn: false,
      showWhenLoggedOut: true,
    },
    {
      id: MenuItem.Contact,
      label: t('menu.contact'),
      path: '/contact',
      requiresAuth: false,
      showWhenLoggedIn: false,
      showWhenLoggedOut: true,
    },
  ];
}

