/**
 * @fileoverview Mock for uuid module
 * @summary Mock implementation for uuid v4 function
 * @description This mock provides a minimal implementation of the uuid v4 function
 * to prevent Jest from failing when uuid module tries to use ES modules.
 */

export const v4 = jest.fn(() => 'mock-uuid-v4');
export default { v4 };
