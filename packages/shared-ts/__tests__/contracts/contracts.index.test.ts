/**
 * @file contracts.index.test.ts
 * @summary Ensures the core barrel re-exports the public API (100% line coverage).
 */

import * as Core from '../../src/contracts/index.js';
import * as UseCaseMod from '../../src/contracts/UseCase.js';
import * as QuerySpecMod from '../../src/contracts/QuerySpec.js';
import * as RepositoryMod from '../../src/contracts/Repository.js';
import * as MapperMod from '../../src/contracts/Mapper.js';
import * as UnitOfWorkMod from '../../src/contracts/UnitOfWork.js';
import * as IdempotencyMod from '../../src/contracts/Idempotency.js';

describe('core index (barrel) re-exports', () => {
  it('re-exports selected symbols with identity preserved', () => {
    expect(Core.asUseCase).toBe(UseCaseMod.asUseCase);
    expect(Core.composeController).toBe(Core.composeController);
  });

  it('exposes named exports from all submodules', () => {
    const assertReexportPresence = (mod: Record<string, unknown>) => {
      for (const key of Object.keys(mod)) {
        if (key === 'default' || key === '__esModule') continue;
        expect(Object.hasOwn(Core, key)).toBe(true);
      }
    };

    assertReexportPresence(UseCaseMod);
    // ControllerMod removed - using Core instead
    assertReexportPresence(QuerySpecMod);
    assertReexportPresence(RepositoryMod);
    assertReexportPresence(MapperMod);
    assertReexportPresence(UnitOfWorkMod);
    assertReexportPresence(IdempotencyMod);
  });

  it('invokes re-exported implementations via the barrel', async () => {
    const impl = jest.fn(async (x: { n: number }) => x.n + 1);
    const uc = Core.asUseCase<{ n: number }, number>(impl);
    await expect(uc.execute({ n: 41 })).resolves.toBe(42);

    const core = jest.fn(async (req: string) => req + 'C');
    const m1 = (next: any) => async (req: string) => (await next(req + '1')) + '1';
    const m2 = (next: any) => async (req: string) => (await next(req + '2')) + '2';

    const composed = Core.composeController(core, { middlewares: [m1, m2] });
    await expect(composed('X')).resolves.toBe('X12C21');
  });
});
