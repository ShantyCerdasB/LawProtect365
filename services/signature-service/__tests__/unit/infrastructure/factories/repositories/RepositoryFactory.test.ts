describe('RepositoryFactory', () => {
  it('should exist as a file', () => {
    const fs = require('node:fs');
    const path = require('node:path');
    const filePath = path.join(__dirname, '../../../../../src/infrastructure/factories/repositories/RepositoryFactory.ts');
    expect(fs.existsSync(filePath)).toBe(true);
  });
});