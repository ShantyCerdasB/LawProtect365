describe('CompositionRoot', () => {
  it('should exist as a file', () => {
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(__dirname, '../../../../src/infrastructure/factories/CompositionRoot.ts');
    expect(fs.existsSync(filePath)).toBe(true);
  });
});
