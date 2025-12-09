/**
 * @fileoverview Query Client Factory Tests - Ensures createQueryClient works
 * @summary Tests for foundation/query/createQueryClient.ts
 */

import { createQueryClient } from '../../../src/foundation/query/createQueryClient';

describe('createQueryClient', () => {
  it('creates a client instance using the provided constructor', () => {
    class FakeQueryClient {
      config: unknown;
      constructor(config?: unknown) {
        this.config = config;
      }
      invalidateQueries() {
        // noop
      }
    }

    const config = { staleTime: 1000 };
    const client = createQueryClient(FakeQueryClient, config) as any;

    expect(client).toBeInstanceOf(FakeQueryClient);
    expect(client.config).toEqual(config);
    expect(typeof client.invalidateQueries).toBe('function');
  });
});


