import { MenuItem } from '../enums/MenuItem';
import type { MenuItemConfig } from '../interfaces/MenuConfigInterfaces';

export const menuConfig: MenuItemConfig[] = [
  {
    id: MenuItem.Home,
    label: 'HOME',
    path: '/',
    requiresAuth: false,
    showWhenLoggedIn: false,
    showWhenLoggedOut: true,
  },
  {
    id: MenuItem.OurServices,
    label: 'OUR SERVICES',
    path: '/our-services',
    requiresAuth: false,
    showWhenLoggedIn: false,
    showWhenLoggedOut: true,
  },
  {
    id: MenuItem.Membership,
    label: 'MEMBERSHIP',
    path: '/membership',
    requiresAuth: false,
    showWhenLoggedIn: false,
    showWhenLoggedOut: true,
  },
  {
    id: MenuItem.Sign365,
    label: 'SIGN 365',
    path: '/sign-365',
    requiresAuth: false,
    showWhenLoggedIn: false,
    showWhenLoggedOut: true,
  },
  {
    id: MenuItem.Contact,
    label: 'CONTACT',
    path: '/contact',
    requiresAuth: false,
    showWhenLoggedIn: false,
    showWhenLoggedOut: true,
  },
];

