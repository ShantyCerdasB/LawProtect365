/**
 * @fileoverview Component Fixtures - Pre-configured component prop fixtures
 * @summary Ready-to-use component props for common test scenarios
 * @description
 * Provides pre-configured component prop objects for common use cases.
 * These fixtures can be imported directly and used in tests without modification,
 * or extended with additional properties as needed.
 */

import type { ButtonProps } from '@ui-kit/buttons/interfaces/ButtonInterfaces';

/**
 * @description Primary button fixture with default configuration.
 */
export const buttonFixtures = {
  primary: {
    variant: 'primary' as const,
    size: 'md' as const,
    children: 'Primary Button',
  } satisfies Partial<ButtonProps>,

  secondary: {
    variant: 'outline' as const,
    size: 'md' as const,
    children: 'Secondary Button',
  } satisfies Partial<ButtonProps>,

  outline: {
    variant: 'outline' as const,
    size: 'md' as const,
    children: 'Outline Button',
  } satisfies Partial<ButtonProps>,

  disabled: {
    variant: 'primary' as const,
    size: 'md' as const,
    children: 'Disabled Button',
    disabled: true,
  } satisfies Partial<ButtonProps>,
};

/**
 * @description Modal fixtures with common configurations.
 */
export const modalFixtures = {
  basic: {
    isOpen: true,
    onClose: jest.fn(),
    title: 'Test Modal',
    children: 'Modal content',
  },

  confirm: {
    isOpen: true,
    onClose: jest.fn(),
    onConfirm: jest.fn(),
    title: 'Confirm Action',
    message: 'Are you sure you want to proceed?',
    confirmLabel: 'Yes',
    cancelLabel: 'No',
  },
};

/**
 * @description Form field fixtures.
 */
export const formFieldFixtures = {
  textField: {
    label: 'Email',
    name: 'email',
    type: 'email' as const,
    value: '',
    onChange: jest.fn(),
  },

  select: {
    label: 'Country',
    name: 'country',
    options: [
      { value: 'us', label: 'United States' },
      { value: 'mx', label: 'Mexico' },
      { value: 'ca', label: 'Canada' },
    ],
    value: '',
    onChange: jest.fn(),
  },
};
