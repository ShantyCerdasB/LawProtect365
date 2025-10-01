describe('RepositoryFactory', () => {
  it('should exist as a file', () => {
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(__dirname, '../../../../../src/infrastructure/factories/repositories/RepositoryFactory.ts');
    expect(fs.existsSync(filePath)).toBe(true);
  });
});