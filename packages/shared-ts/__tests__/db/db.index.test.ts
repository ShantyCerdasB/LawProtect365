/**
 * @file db.index.test.ts
 * @summary Ensures the DB barrel re-exports the public API (100% line coverage).
 */

import * as DB from '../../src/db/index.js';
import * as PrismaClientMod from '../../src/db/prismaClient.js';
import * as PrismaTxMod from '../../src/db/prismaTx.js';
import * as CursorMod from '../../src/db/cursor.js';
import * as PaginationMod from '../../src/db/pagination.js';
import * as PortsMod from '../../src/db/ports.js';
import * as RepositoryBaseMod from '../../src/db/repositoryBase.js';

describe('db index (barrel) re-exports', () => {
  /**
   * Verifies symbol identity for selected exports to guard against regressions.
   */
  it('re-exports selected symbols with identity preserved', () => {
    // prismaClient
    expect(DB.getPrisma).toBe(PrismaClientMod.getPrisma);
    expect(DB.createPrisma).toBe(PrismaClientMod.createPrisma);

    // prismaTx
    expect(DB.withTransaction).toBe(PrismaTxMod.withTransaction);

    // cursor
    expect(DB.encodeCursor).toBe(CursorMod.encodeCursor);
    expect(DB.decodeCursor).toBe(CursorMod.decodeCursor);
    expect(DB.cursorFromRecord).toBe(CursorMod.cursorFromRecord);

    // pagination
    expect(DB.pageFromRows).toBe(PaginationMod.pageFromRows);
    expect(DB.idCursorFromRow).toBe(PaginationMod.idCursorFromRow);
    expect(DB.getIdFromCursor).toBe(PaginationMod.getIdFromCursor);

    // repositoryBase
    expect(DB.RepositoryBase).toBe(RepositoryBaseMod.RepositoryBase);
  });

  /**
   * Asserts that the barrel exposes all named exports from each submodule.
   */
  it('exposes all named exports from submodules', () => {
    const assertAllExportsPresent = (mod: Record<string, unknown>) => {
      for (const key of Object.keys(mod)) {
        if (key === 'default' || key === '__esModule') continue;
        expect(Object.prototype.hasOwnProperty.call(DB, key)).toBe(true);
      }
    };

    assertAllExportsPresent(PrismaClientMod);
    assertAllExportsPresent(PrismaTxMod);
    assertAllExportsPresent(CursorMod);
    assertAllExportsPresent(PaginationMod);
    assertAllExportsPresent(PortsMod);
    assertAllExportsPresent(RepositoryBaseMod);
  });
});
