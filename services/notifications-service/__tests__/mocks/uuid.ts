/**
 * @fileoverview UUID Mock - Mock for uuid module
 * @summary Mock implementation of uuid module for testing
 */

// Generate valid UUIDs without importing uuid (to avoid circular dependency)
// Format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
function generateValidUuid(): string {
  const chars = '0123456789abcdef';
  let uuid = '';
  
  // Generate random hex characters
  for (let i = 0; i < 36; i++) {
    if (i === 8 || i === 13 || i === 18 || i === 23) {
      uuid += '-';
    } else if (i === 14) {
      uuid += '4'; // Version 4
    } else if (i === 19) {
      uuid += chars[Math.floor(Math.random() * 4) + 8]; // 8, 9, a, or b
    } else {
      uuid += chars[Math.floor(Math.random() * 16)];
    }
  }
  
  return uuid;
}

let counter = 0;
export const v4 = jest.fn(() => {
  counter++;
  return generateValidUuid();
});
export default { v4 };

