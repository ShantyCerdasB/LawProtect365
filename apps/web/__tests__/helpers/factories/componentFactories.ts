/**
 * @fileoverview Component Factories - Factory functions for creating component props
 * @summary Reusable factories for generating test component props with sensible defaults
 * @description
 * Provides factory functions that create component prop objects with default values.
 * These factories help reduce test duplication and ensure consistency across test files.
 * All factories accept optional overrides to customize the generated props.
 */

import React, { type ReactNode, type ButtonHTMLAttributes, type InputHTMLAttributes, type SelectHTMLAttributes } from 'react';
import type { ButtonProps } from '@ui-kit/buttons/interfaces/ButtonInterfaces';

/**
 * @description Creates Button component props with default values.
 * @param overrides Optional props to override defaults
 * @returns ButtonProps object with defaults applied
 */
export function createButtonProps(overrides?: Partial<ButtonProps>): ButtonProps {
  return {
    variant: 'primary',
    size: 'md',
    children: 'Test Button',
    ...overrides,
  };
}

/**
 * @description Creates IconButton component props with default values.
 * @param overrides Optional props to override defaults
 * @returns IconButton props object with defaults applied
 */
export function createIconButtonProps(
  overrides?: Partial<ButtonHTMLAttributes<HTMLButtonElement> & { icon: ReactNode }>
): ButtonHTMLAttributes<HTMLButtonElement> & { icon: ReactNode } {
  return {
    icon: React.createElement('span', null, 'Test Icon'),
    'aria-label': 'Test Icon Button',
    onClick: jest.fn(),
    ...overrides,
  };
}

/**
 * @description Creates TextField component props with default values.
 * @param overrides Optional props to override defaults
 * @returns TextField props object with defaults applied
 */
export function createTextFieldProps(
  overrides?: Partial<InputHTMLAttributes<HTMLInputElement> & { label?: string; helpText?: string }>
): InputHTMLAttributes<HTMLInputElement> & { label?: string; helpText?: string } {
  return {
    label: 'Test Label',
    name: 'test-field',
    value: '',
    onChange: jest.fn(),
    ...overrides,
  };
}

/**
 * @description Creates Select component props with default values.
 * @param overrides Optional props to override defaults
 * @returns Select props object with defaults applied
 */
export function createSelectProps(
  overrides?: Partial<SelectHTMLAttributes<HTMLSelectElement> & { label?: string; options?: Array<{ value: string; label: string }> }>
): SelectHTMLAttributes<HTMLSelectElement> & { label?: string; options?: Array<{ value: string; label: string }> } {
  return {
    label: 'Test Select',
    name: 'test-select',
    options: [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' },
    ],
    value: '',
    onChange: jest.fn(),
    ...overrides,
  };
}

/**
 * @description Creates Modal component props with default values.
 * @param overrides Optional props to override defaults
 * @returns Modal props object with defaults applied
 */
export function createModalProps(
  overrides?: Partial<{ title?: string; isOpen?: boolean; onClose?: () => void; children?: ReactNode }>
): { title?: string; isOpen?: boolean; onClose?: () => void; children?: ReactNode } {
  return {
    isOpen: true,
    onClose: jest.fn(),
    title: 'Test Modal',
    children: 'Test content',
    ...overrides,
  };
}

/**
 * @description Creates Alert component props with default values.
 * @param overrides Optional props to override defaults
 * @returns Alert props object with defaults applied
 */
export function createAlertProps(
  overrides?: Partial<{ title?: string; message: string; tone?: 'info' | 'success' | 'warning' | 'error' }>
): { title?: string; message: string; tone?: 'info' | 'success' | 'warning' | 'error' } {
  return {
    tone: 'info',
    message: 'Test alert message',
    ...overrides,
  };
}

export interface MenuItemConfig {
  id: string;
  label: string;
  path: string;
  requiresAuth: boolean;
  showWhenLoggedIn: boolean;
  showWhenLoggedOut: boolean;
}

export function createMenuItemConfig(
  overrides?: Partial<MenuItemConfig>
): MenuItemConfig {
  return {
    id: 'test-item',
    label: 'Test Item',
    path: '/test',
    requiresAuth: false,
    showWhenLoggedIn: true,
    showWhenLoggedOut: true,
    ...overrides,
  };
}
