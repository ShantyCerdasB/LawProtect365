/**
 * @fileoverview Form Testing Utilities - Utilities for testing form components
 * @summary Reusable utilities for testing form interactions, validation, and submissions
 * @description
 * Provides utilities for testing form components, including input interactions,
 * validation assertions, form submission testing, and error state handling.
 */

import { screen, waitFor } from '@testing-library/react';
import type { Matcher } from '@testing-library/react';

/**
 * @description Options for filling form fields.
 */
export interface FillFormOptions {
  skipValidation?: boolean;
  delay?: number;
}

/**
 * @description Fills a text input field with the provided value.
 * @param label Input label or accessible name
 * @param value Value to enter
 * @param options Optional configuration
 * @returns Promise that resolves when input is filled
 */
export async function fillTextField(
  label: string | RegExp,
  value: string,
  options?: FillFormOptions
): Promise<void> {
  // @ts-ignore - user-event types may not be available during type checking
  const userEvent = (await import('@testing-library/user-event')).default;
  const user = userEvent.setup({ delay: options?.delay });
  const input = screen.getByLabelText(label);
  
  await user.clear(input);
  await user.type(input, value, { skipAutoClose: options?.skipValidation });
}

/**
 * @description Fills a select field with the provided option.
 * @param label Select label or accessible name
 * @param optionValue Value of the option to select
 * @param options Optional configuration
 * @returns Promise that resolves when option is selected
 */
export async function fillSelectField(
  label: string | RegExp,
  optionValue: string,
  options?: FillFormOptions
): Promise<void> {
  // @ts-ignore - user-event types may not be available during type checking
  const userEvent = (await import('@testing-library/user-event')).default;
  const user = userEvent.setup({ delay: options?.delay });
  const select = screen.getByLabelText(label);
  
  await user.selectOptions(select, optionValue);
}

/**
 * @description Checks or unchecks a checkbox.
 * @param label Checkbox label or accessible name
 * @param checked Whether checkbox should be checked (default: true)
 * @param options Optional configuration
 * @returns Promise that resolves when checkbox is toggled
 */
export async function toggleCheckbox(
  label: string | RegExp,
  checked: boolean = true,
  options?: FillFormOptions
): Promise<void> {
  // @ts-ignore - user-event types may not be available during type checking
  const userEvent = (await import('@testing-library/user-event')).default;
  const user = userEvent.setup({ delay: options?.delay });
  const checkbox = screen.getByLabelText(label) as HTMLInputElement;
  
  if (checked && !checkbox.checked) {
    await user.click(checkbox);
  } else if (!checked && checkbox.checked) {
    await user.click(checkbox);
  }
}

/**
 * @description Submits a form by clicking the submit button.
 * @param buttonText Submit button text or label
 * @param options Optional configuration
 * @returns Promise that resolves when form is submitted
 */
export async function submitForm(
  buttonText: string | RegExp,
  options?: FillFormOptions
): Promise<void> {
  // @ts-ignore - user-event types may not be available during type checking
  const userEvent = (await import('@testing-library/user-event')).default;
  const user = userEvent.setup({ delay: options?.delay });
  const submitButton = screen.getByRole('button', { name: buttonText });
  
  await user.click(submitButton);
}

/**
 * @description Asserts that a form field displays a validation error.
 * @param label Field label or accessible name
 * @param errorMessage Expected error message (string or regex)
 * @throws Error if field doesn't show the expected error
 */
export function assertFieldValidationError(
  label: string | RegExp,
  errorMessage: string | RegExp
): void {
  const field = screen.getByLabelText(label);
  expect(field).toBeInvalid();
  expect(screen.getByText(errorMessage)).toBeInTheDocument();
}

/**
 * @description Asserts that a form field is valid (no errors).
 * @param label Field label or accessible name
 * @throws Error if field is invalid or has errors
 */
export function assertFieldValid(label: string | RegExp): void {
  const field = screen.getByLabelText(label);
  expect(field).toBeValid();
  
  const errorElements = screen.queryAllByRole('alert');
  const fieldContainer = field.closest('div, form, section');
  
  if (fieldContainer) {
    const fieldErrors = Array.from(fieldContainer.querySelectorAll('[role="alert"]'))
      .filter((error) => fieldContainer.contains(error));
    
    expect(fieldErrors.length).toBe(0);
  }
}

/**
 * @description Asserts that a form field has the expected value.
 * @param label Field label or accessible name
 * @param expectedValue Expected field value
 * @throws Error if field value doesn't match
 */
export function assertFieldValue(label: string | RegExp, expectedValue: string): void {
  const field = screen.getByLabelText(label);
  expect(field).toHaveValue(expectedValue);
}

/**
 * @description Asserts that a form field is required.
 * @param label Field label or accessible name
 * @throws Error if field is not marked as required
 */
export function assertFieldRequired(label: string | RegExp): void {
  const field = screen.getByLabelText(label);
  expect(field).toBeRequired();
}

/**
 * @description Asserts that a form field is disabled.
 * @param label Field label or accessible name
 * @throws Error if field is not disabled
 */
export function assertFieldDisabled(label: string | RegExp): void {
  const field = screen.getByLabelText(label);
  expect(field).toBeDisabled();
}

/**
 * @description Asserts that a form field is enabled.
 * @param label Field label or accessible name
 * @throws Error if field is disabled
 */
export function assertFieldEnabled(label: string | RegExp): void {
  const field = screen.getByLabelText(label);
  expect(field).toBeEnabled();
}

/**
 * @description Waits for form validation errors to appear.
 * @param label Field label or accessible name
 * @param timeout Timeout in milliseconds
 * @returns Promise that resolves when error appears
 * @throws Error if error doesn't appear within timeout
 */
export async function waitForFieldError(
  label: string | RegExp,
  timeout: number = 1000
): Promise<HTMLElement> {
  return waitFor(
    () => {
      const field = screen.getByLabelText(label);
      const fieldContainer = field.closest('div, form, section');
      
      if (!fieldContainer) {
        throw new Error('Field container not found');
      }
      
      const errorElement = fieldContainer.querySelector('[role="alert"]');
      
      if (!errorElement) {
        throw new Error('Validation error not found');
      }
      
      return errorElement as HTMLElement;
    },
    { timeout }
  );
}

/**
 * @description Fills multiple form fields in sequence.
 * @param fields Object mapping field labels to values
 * @param options Optional configuration
 * @returns Promise that resolves when all fields are filled
 */
export async function fillFormFields(
  fields: Record<string, string | boolean>,
  options?: FillFormOptions
): Promise<void> {
  for (const [label, value] of Object.entries(fields)) {
    if (typeof value === 'boolean') {
      await toggleCheckbox(label, value, options);
    } else {
      const field = screen.getByLabelText(label);
      const fieldType = field.getAttribute('type');
      
      if (field.tagName === 'SELECT') {
        await fillSelectField(label, value, options);
      } else {
        await fillTextField(label, value, options);
      }
    }
  }
}












