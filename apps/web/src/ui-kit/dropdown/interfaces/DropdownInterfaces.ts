/**
 * @fileoverview Dropdown Interfaces - Types for the generic Dropdown component
 * @summary Defines interfaces for dropdown items and configuration
 */

import type { ReactNode } from 'react';

export interface DropdownItem<T = string> {
  value: T;
  label: ReactNode;
  selected?: boolean;
}

export interface DropdownProps<T = string> {
  items: DropdownItem<T>[];
  selectedValue?: T;
  onSelect: (value: T) => void;
  trigger: (isOpen: boolean) => ReactNode;
  className?: string;
  dropdownClassName?: string;
  itemClassName?: string;
  selectedItemClassName?: string;
  placeholder?: string;
}

