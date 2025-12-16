/**
 * @fileoverview Jest DOM Type Declarations
 * @summary Type definitions for @testing-library/jest-dom matchers
 * @description
 * Ensures TypeScript recognizes jest-dom custom matchers by importing
 * the types from @testing-library/jest-dom package.
 */

/// <reference types="@testing-library/jest-dom" />

import '@testing-library/jest-dom';

declare global {
  namespace jest {
    interface Matchers<R = void> {
      toBeInTheDocument(): R;
      toHaveClass(...classNames: string[]): R;
      toHaveStyle(style: Record<string, string> | string): R;
      toHaveAttribute(attr: string, value?: string): R;
      toBeDisabled(): R;
      toBeRequired(): R;
      toHaveValue(value: string | number): R;
      not: Matchers<R>;
    }
  }
}

export {};

