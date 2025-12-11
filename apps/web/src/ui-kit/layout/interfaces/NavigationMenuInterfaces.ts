/**
 * @fileoverview Navigation Menu Interfaces - Types for navigation menu component
 * @summary Type definitions for navigation menu props
 * @description Defines interfaces used by the NavigationMenu component.
 */

import type { MenuItemConfig } from './MenuConfigInterfaces';

export interface NavigationMenuProps {
  items: MenuItemConfig[];
  className?: string;
  itemClassName?: string;
}

