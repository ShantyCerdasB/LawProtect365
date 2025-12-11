/**
 * @fileoverview Menu Config Interfaces - Types for menu configuration
 * @summary Type definitions for menu item configuration
 * @description Defines interfaces used by the menu configuration.
 */

import type { MenuItem } from '../enums/MenuItem';

export interface MenuItemConfig {
  id: MenuItem;
  label: string;
  path: string;
  requiresAuth: boolean;
  showWhenLoggedIn: boolean;
  showWhenLoggedOut: boolean;
}

