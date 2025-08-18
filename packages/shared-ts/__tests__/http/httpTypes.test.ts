/**
 * @file httpTypes.test.ts
 * @summary Runtime assertions for HttpStatus enum (100% line coverage).
 */

import { HttpStatus } from '../../src/http/httpTypes.js';

describe('HttpStatus enum', () => {
  it('exposes the expected numeric values', () => {
    expect(HttpStatus.OK).toBe(200);
    expect(HttpStatus.CREATED).toBe(201);
    expect(HttpStatus.NO_CONTENT).toBe(204);

    expect(HttpStatus.BAD_REQUEST).toBe(400);
    expect(HttpStatus.UNAUTHORIZED).toBe(401);
    expect(HttpStatus.FORBIDDEN).toBe(403);
    expect(HttpStatus.NOT_FOUND).toBe(404);
    expect(HttpStatus.CONFLICT).toBe(409);
    expect(HttpStatus.UNSUPPORTED_MEDIA_TYPE).toBe(415);
    expect(HttpStatus.UNPROCESSABLE_ENTITY).toBe(422);
    expect(HttpStatus.TOO_MANY_REQUESTS).toBe(429);

    expect(HttpStatus.INTERNAL_ERROR).toBe(500);
    expect(HttpStatus.NOT_IMPLEMENTED).toBe(501);
  });

  it('provides reverse mappings for numeric enum members', () => {
    const E = HttpStatus as unknown as Record<string | number, string | number>;
    expect(E[200]).toBe('OK');
    expect(E[201]).toBe('CREATED');
    expect(E[204]).toBe('NO_CONTENT');
    expect(E[400]).toBe('BAD_REQUEST');
    expect(E[401]).toBe('UNAUTHORIZED');
    expect(E[403]).toBe('FORBIDDEN');
    expect(E[404]).toBe('NOT_FOUND');
    expect(E[409]).toBe('CONFLICT');
    expect(E[415]).toBe('UNSUPPORTED_MEDIA_TYPE');
    expect(E[422]).toBe('UNPROCESSABLE_ENTITY');
    expect(E[429]).toBe('TOO_MANY_REQUESTS');
    expect(E[500]).toBe('INTERNAL_ERROR');
    expect(E[501]).toBe('NOT_IMPLEMENTED');
  });
});
