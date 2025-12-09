/**
 * @fileoverview HttpError Tests - Unit tests for HTTP error class
 * @summary Tests for HttpError custom error class
 */

import { HttpError } from '../../../src/foundation/http/errors';

describe('HttpError', () => {
  it('should create an error with message', () => {
    const error = new HttpError('Test error');

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('Test error');
    expect(error.status).toBeUndefined();
  });

  it('should create an error with message and status', () => {
    const error = new HttpError('Not found', 404);

    expect(error.message).toBe('Not found');
    expect(error.status).toBe(404);
  });

  it('should be throwable and catchable', () => {
    expect(() => {
      throw new HttpError('Test error', 500);
    }).toThrow(HttpError);

    try {
      throw new HttpError('Test error', 500);
    } catch (error) {
      expect(error).toBeInstanceOf(HttpError);
      if (error instanceof HttpError) {
        expect(error.message).toBe('Test error');
        expect(error.status).toBe(500);
      }
    }
  });

  it('should have readonly status property', () => {
    const error = new HttpError('Test', 400);
    
    // TypeScript should prevent assignment, but we test runtime behavior
    expect(() => {
      // @ts-expect-error - Testing readonly behavior
      error.status = 500;
    }).not.toThrow(); // JavaScript allows it, but TypeScript should warn
  });
});

