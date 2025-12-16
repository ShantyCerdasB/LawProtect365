/**
 * @fileoverview Assertion Utilities - Custom assertion helpers for tests
 * @summary Reusable assertion functions for common test patterns
 * @description
 * Provides custom assertion functions that wrap common testing patterns
 * to reduce duplication and improve test readability.
 */

import { screen } from '@testing-library/react';
import '@testing-library/jest-dom';

/**
 * @description Asserts that a button is present and enabled.
 * @param name Button name, label, or role
 * @throws Error if button is not found or is disabled
 */
export function assertButtonEnabled(name: string | RegExp): void {
  const button = screen.getByRole('button', { name });
  expect(button).toBeInTheDocument();
  expect(button).not.toBeDisabled();
}

/**
 * @description Asserts that a button is present and disabled.
 * @param name Button name, label, or role
 * @throws Error if button is not found or is enabled
 */
export function assertButtonDisabled(name: string | RegExp): void {
  const button = screen.getByRole('button', { name });
  expect(button).toBeInTheDocument();
  expect(button).toBeDisabled();
}

/**
 * @description Asserts that an input field has the expected value.
 * @param label Input label or accessible name
 * @param expectedValue Expected input value
 * @throws Error if input is not found or value doesn't match
 */
export function assertInputValue(
  label: string | RegExp,
  expectedValue: string
): void {
  const input = screen.getByLabelText(label);
  expect(input).toBeInTheDocument();
  expect(input).toHaveValue(expectedValue);
}

/**
 * @description Asserts that text content is present in the document.
 * @param text Text to search for (string or regex)
 * @throws Error if text is not found
 */
export function assertTextInDocument(text: string | RegExp): void {
  expect(screen.getByText(text)).toBeInTheDocument();
}

/**
 * @description Asserts that text content is not present in the document.
 * @param text Text to search for (string or regex)
 * @throws Error if text is found
 */
export function assertTextNotInDocument(text: string | RegExp): void {
  expect(screen.queryByText(text)).not.toBeInTheDocument();
}

/**
 * @description Asserts that an element has a specific CSS class.
 * @param element Element to check
 * @param className Expected CSS class name
 * @throws Error if element doesn't have the class
 */
export function assertElementHasClass(
  element: HTMLElement,
  className: string
): void {
  expect(element).toHaveClass(className);
}

/**
 * @description Asserts that a link has the correct href.
 * @param linkElement Link element or accessible name
 * @param expectedHref Expected href value
 * @throws Error if link is not found or href doesn't match
 */
export function assertLinkHref(
  linkElement: HTMLElement | string | RegExp,
  expectedHref: string
): void {
  const link =
    typeof linkElement === 'string' || linkElement instanceof RegExp
      ? screen.getByRole('link', { name: linkElement })
      : linkElement;
  expect(link).toBeInTheDocument();
  expect(link).toHaveAttribute('href', expectedHref);
}

/**
 * @description Asserts that a form field shows a validation error.
 * @param label Field label or accessible name
 * @param errorMessage Expected error message
 * @throws Error if error message is not found
 */
export function assertFieldError(
  label: string | RegExp,
  errorMessage: string | RegExp
): void {
  const field = screen.getByLabelText(label);
  expect(field).toBeInvalid();
  expect(screen.getByText(errorMessage)).toBeInTheDocument();
}
