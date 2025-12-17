/**
 * @fileoverview UUID Mock - Mock for uuid module
 * @summary Mock implementation of uuid module for testing
 */

export const v4 = jest.fn(() => 'mock-uuid-v4');
export default { v4 };

