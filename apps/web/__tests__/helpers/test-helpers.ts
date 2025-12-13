/**
 * @fileoverview Test Helpers - Reusable test utilities and assertions
 * @summary Shared helper functions for common test patterns
 * @description Provides utility functions for testing React components, routing, and async operations.
 */

import { waitFor, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React, { type ReactElement } from 'react';

/**
 * @description Waits for an element to appear in the DOM.
 * @param queryFn Function that queries for the element
 * @param options Optional wait options
 * @returns Promise that resolves when element is found
 */
export async function waitForElement(
  queryFn: () => HTMLElement | null,
  options?: { timeout?: number }
): Promise<HTMLElement> {
  return waitFor(() => {
    const element = queryFn();
    if (!element) {
      throw new Error('Element not found');
    }
    return element;
  }, {
    timeout: options?.timeout || 1000,
  });
}

/**
 * @description Creates a delay for testing async operations.
 * @param ms Milliseconds to delay
 * @returns Promise that resolves after the delay
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * @description Asserts that a component renders without errors.
 * @param component Component to test
 * @param props Optional props to pass to component
 */
export function expectComponentToRender<T extends Record<string, unknown>>(
  component: React.ComponentType<T>,
  props?: T
): void {
  const { render } = require('@testing-library/react');
  const Component = component;
  const { container } = render(React.createElement(Component, props || ({} as T)));
  expect(container).toBeInTheDocument();
}

/**
 * @description Asserts that a link has the correct href.
 * @param linkElement Link element to test
 * @param expectedHref Expected href value
 */
export function expectLinkToHaveHref(
  linkElement: HTMLElement,
  expectedHref: string
): void {
  expect(linkElement).toHaveAttribute('href', expectedHref);
}

/**
 * @description Asserts that a button is disabled.
 * @param buttonElement Button element to test
 */
export function expectButtonToBeDisabled(buttonElement: HTMLElement): void {
  expect(buttonElement).toBeDisabled();
}

/**
 * @description Asserts that a button is enabled.
 * @param buttonElement Button element to test
 */
export function expectButtonToBeEnabled(buttonElement: HTMLElement): void {
  expect(buttonElement).not.toBeDisabled();
}

/**
 * @description Asserts that an input has the correct value.
 * @param inputElement Input element to test
 * @param expectedValue Expected value
 */
export function expectInputToHaveValue(
  inputElement: HTMLElement,
  expectedValue: string
): void {
  expect(inputElement).toHaveValue(expectedValue);
}

/**
 * @description Asserts that text content is present in the document.
 * @param text Text to search for
 */
export function expectTextToBeInDocument(text: string): void {
  const { screen } = require('@testing-library/react');
  expect(screen.getByText(text)).toBeInTheDocument();
}

/**
 * @description Asserts that an element has a specific CSS class.
 * @param element Element to test
 * @param className Expected CSS class name
 */
export function expectElementToHaveClass(
  element: HTMLElement,
  className: string
): void {
  expect(element).toHaveClass(className);
}

