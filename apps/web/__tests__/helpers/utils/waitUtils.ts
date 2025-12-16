/**
 * @fileoverview Wait Utilities - Async wait and polling utilities for tests
 * @summary Reusable utilities for waiting on async operations in tests
 * @description
 * Provides utility functions for waiting on async operations, element appearance,
 * and condition polling to make async tests more reliable and readable.
 */

import { waitFor, waitForElementToBeRemoved } from '@testing-library/react';
import type { Matcher } from '@testing-library/react';

/**
 * @description Waits for an element to appear in the DOM.
 * @param queryFn Function that queries for the element
 * @param options Optional wait options
 * @returns Promise that resolves when element is found
 * @throws Error if element is not found within timeout
 */
export async function waitForElement(
  queryFn: () => HTMLElement | null,
  options?: { timeout?: number }
): Promise<HTMLElement> {
  return waitFor(
    () => {
      const element = queryFn();
      if (!element) {
        throw new Error('Element not found');
      }
      return element;
    },
    {
      timeout: options?.timeout || 1000,
    }
  );
}

/**
 * @description Waits for an element to be removed from the DOM.
 * @param element Element or query function for element to wait for removal
 * @param options Optional wait options
 * @returns Promise that resolves when element is removed
 */
export async function waitForElementRemoval(
  element: HTMLElement | (() => HTMLElement | null),
  options?: { timeout?: number }
): Promise<void> {
  const elementOrQuery =
    typeof element === 'function' ? element() : element;
  if (elementOrQuery) {
    await waitForElementToBeRemoved(elementOrQuery, {
      timeout: options?.timeout || 1000,
    });
  }
}

/**
 * @description Waits for text content to appear in the document.
 * @param text Text to wait for (string or regex)
 * @param options Optional wait options
 * @returns Promise that resolves when text is found
 */
export async function waitForText(
  text: string | RegExp,
  options?: { timeout?: number }
): Promise<HTMLElement> {
  return waitFor(
    () => {
      const element = document.body.querySelector(`*`);
      const textContent = element?.textContent || '';
      const matches = typeof text === 'string' 
        ? textContent.includes(text)
        : text.test(textContent);
      
      if (!matches) {
        throw new Error(`Text "${text}" not found`);
      }
      return element as HTMLElement;
    },
    {
      timeout: options?.timeout || 1000,
    }
  );
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
 * @description Waits for a condition to become true.
 * @param condition Function that returns true when condition is met
 * @param options Optional wait options
 * @returns Promise that resolves when condition is true
 * @throws Error if condition is not met within timeout
 */
export async function waitForCondition(
  condition: () => boolean | Promise<boolean>,
  options?: { timeout?: number; interval?: number }
): Promise<void> {
  return waitFor(
    async () => {
      const result = await condition();
      if (!result) {
        throw new Error('Condition not met');
      }
    },
    {
      timeout: options?.timeout || 1000,
      interval: options?.interval || 50,
    }
  );
}
