/**
 * @file repositoryBase.test.ts
 * @summary Tests for RepositoryBase abstract class.
 */

import { RepositoryBase, type PrismaClientLike, type PrismaTxLike } from '../../src/db/repositoryBase.js';

// Test domain entity
interface TestDomain {
  id: string;
  name: string;
  value: number;
}

// Test specification
interface TestSpec {
  name?: string;
  minValue?: number;
}

// Concrete implementation for testing
class TestRepository extends RepositoryBase<TestDomain, string, TestSpec> {
  constructor(prisma: PrismaClientLike) {
    super(prisma);
  }

  protected toDomain(row: unknown): TestDomain {
    const data = row as { id: string; name: string; value: number };
    return {
      id: data.id,
      name: data.name,
      value: data.value,
    };
  }

  protected toModel(entity: Partial<TestDomain>): unknown {
    return {
      id: entity.id,
      name: entity.name,
      value: entity.value,
    };
  }

  protected whereById(id: string): unknown {
    return { id };
  }

  protected whereFromSpec(spec: TestSpec): unknown {
    const where: any = {};
    if (spec.name) where.name = spec.name;
    if (spec.minValue !== undefined) where.value = { gte: spec.minValue };
    return where;
  }

  async findById(id: string, tx?: PrismaTxLike): Promise<TestDomain | null> {
    // Mock implementation
    if (id === 'existing') {
      return this.toDomain({ id, name: 'Test Entity', value: 42 });
    }
    return null;
  }

  async create(data: Partial<TestDomain>, tx?: PrismaTxLike): Promise<TestDomain> {
    const entity = {
      id: data.id || 'new-id',
      name: data.name || 'New Entity',
      value: data.value || 0,
    };
    return this.toDomain(entity);
  }

  async update(id: string, patch: Partial<TestDomain>, tx?: PrismaTxLike): Promise<TestDomain> {
    const entity = {
      id,
      name: patch.name || 'Updated Entity',
      value: patch.value || 0,
    };
    return this.toDomain(entity);
  }

  async delete(id: string, tx?: PrismaTxLike): Promise<void> {
    // Mock implementation - no-op
  }

  async list(
    spec: TestSpec,
    limit: number,
    cursor?: string,
    tx?: PrismaTxLike
  ): Promise<{ items: TestDomain[]; nextCursor?: string }> {
    const items = [
      this.toDomain({ id: '1', name: 'Item 1', value: 10 }),
      this.toDomain({ id: '2', name: 'Item 2', value: 20 }),
    ];
    // Return nextCursor when there's a specification (indicating filtered results)
    // Return undefined when no specification (indicating all results, no more pages)
    return { items, nextCursor: Object.keys(spec).length > 0 ? 'next-cursor' : undefined };
  }
}

describe('RepositoryBase', () => {
  let mockPrisma: PrismaClientLike;
  let repository: TestRepository;

  beforeEach(() => {
    mockPrisma = {};
    repository = new TestRepository(mockPrisma);
  });

  describe('constructor', () => {
    it('stores the prisma client', () => {
      expect((repository as any).prisma).toBe(mockPrisma);
    });
  });

  describe('abstract methods', () => {
    it('implements toDomain method', () => {
      const row = { id: 'test', name: 'Test', value: 123 };
      const result = (repository as any).toDomain(row);
      expect(result).toEqual({
        id: 'test',
        name: 'Test',
        value: 123,
      });
    });

    it('implements toModel method', () => {
      const entity = { id: 'test', name: 'Test', value: 123 };
      const result = (repository as any).toModel(entity);
      expect(result).toEqual({
        id: 'test',
        name: 'Test',
        value: 123,
      });
    });

    it('implements whereById method', () => {
      const result = (repository as any).whereById('test-id');
      expect(result).toEqual({ id: 'test-id' });
    });

    it('implements whereFromSpec method', () => {
      const spec = { name: 'test', minValue: 10 };
      const result = (repository as any).whereFromSpec(spec);
      expect(result).toEqual({
        name: 'test',
        value: { gte: 10 },
      });
    });

    it('handles empty spec in whereFromSpec', () => {
      const spec = {};
      const result = (repository as any).whereFromSpec(spec);
      expect(result).toEqual({});
    });

    it('handles partial spec in whereFromSpec', () => {
      const spec = { name: 'test' };
      const result = (repository as any).whereFromSpec(spec);
      expect(result).toEqual({ name: 'test' });
    });
  });

  describe('concrete methods', () => {
    it('finds entity by id', async () => {
      const result = await repository.findById('existing');
      expect(result).toEqual({
        id: 'existing',
        name: 'Test Entity',
        value: 42,
      });
    });

    it('returns null for non-existing entity', async () => {
      const result = await repository.findById('non-existing');
      expect(result).toBeNull();
    });

    it('creates new entity', async () => {
      const data = { name: 'New Test', value: 100 };
      const result = await repository.create(data);
      expect(result).toEqual({
        id: 'new-id',
        name: 'New Test',
        value: 100,
      });
    });

    it('creates entity with provided id', async () => {
      const data = { id: 'custom-id', name: 'Custom', value: 50 };
      const result = await repository.create(data);
      expect(result).toEqual({
        id: 'custom-id',
        name: 'Custom',
        value: 50,
      });
    });

    it('updates existing entity', async () => {
      const patch = { name: 'Updated Name', value: 200 };
      const result = await repository.update('test-id', patch);
      expect(result).toEqual({
        id: 'test-id',
        name: 'Updated Name',
        value: 200,
      });
    });

    it('deletes entity without throwing', async () => {
      await expect(repository.delete('test-id')).resolves.not.toThrow();
    });

    it('lists entities with specification', async () => {
      const spec = { name: 'test', minValue: 5 };
      const result = await repository.list(spec, 10);
      expect(result.items).toHaveLength(2);
      expect(result.nextCursor).toBe('next-cursor');
    });

    it('lists entities without cursor', async () => {
      const spec = {};
      const result = await repository.list(spec, 10);
      expect(result.items).toHaveLength(2);
      expect(result.nextCursor).toBeUndefined();
    });
  });

  describe('transaction support', () => {
    it('accepts optional transaction parameter', async () => {
      const mockTx = {} as PrismaTxLike;
      
      await expect(repository.findById('existing', mockTx)).resolves.not.toThrow();
      await expect(repository.create({ name: 'test' }, mockTx)).resolves.not.toThrow();
      await expect(repository.update('test-id', { name: 'test' }, mockTx)).resolves.not.toThrow();
      await expect(repository.delete('test-id', mockTx)).resolves.not.toThrow();
      await expect(repository.list({}, 10, undefined, mockTx)).resolves.not.toThrow();
    });
  });
});
