/**
 * @file repositoryBase.test.ts
 * @summary Tests for RepositoryBase (100% line coverage of concrete members).
 */

import { RepositoryBase } from '../../src/db/index.js';

type Domain = { id: string; name?: string };
type Id = string;
type Spec = { q: number };

class TestRepo extends RepositoryBase<Domain, Id, Spec> {
  protected toDomain(row: unknown): Domain {
    return row as Domain;
  }
  protected toModel(entity: Partial<Domain>): unknown {
    return entity;
  }
  protected whereById(id: Id): unknown {
    return { id };
  }
  protected whereFromSpec(spec: Spec): unknown {
    return { q: spec.q };
  }
}

describe('RepositoryBase', () => {
  it('stores the provided prisma-like client', () => {
    const prisma = { $transaction: jest.fn() };
    const repo = new TestRepo(prisma as any);

    // Access via cast because prisma is protected
    expect((repo as any).prisma).toBe(prisma);
  });

  it('throws "Not implemented" for CRUD/list methods by default', async () => {
    const repo = new TestRepo({} as any);

    await expect(repo.findById('1')).rejects.toThrow('Not implemented');
    await expect(repo.create({ id: '1', name: 'n' })).rejects.toThrow('Not implemented');
    await expect(repo.update('1', { name: 'x' })).rejects.toThrow('Not implemented');
    await expect(repo.delete('1')).rejects.toThrow('Not implemented');
    await expect(repo.list({ q: 1 }, 10)).rejects.toThrow('Not implemented');
  });
});
