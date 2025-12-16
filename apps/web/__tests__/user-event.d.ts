/**
 * @fileoverview User Event Type Declarations
 * @summary Type definitions for @testing-library/user-event
 * @description
 * Ensures TypeScript recognizes the @testing-library/user-event module
 * and its default export.
 */

declare module '@testing-library/user-event' {
  const userEvent: {
    click: (element: Element | null) => Promise<void>;
    type: (element: Element | null, text: string) => Promise<void>;
    clear: (element: Element | null) => Promise<void>;
    selectOptions: (element: Element | null, values: string | string[]) => Promise<void>;
    [key: string]: any;
  };
  export default userEvent;
}

