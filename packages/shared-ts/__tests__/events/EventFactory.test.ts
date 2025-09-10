/**
 * @file EventFactory.test.ts
 * @summary Tests for makeEvent (100% line coverage).
 */

// Mock using the resolved path that the SUT imports
jest.mock('../../src/utils/id.js', () => ({
  ulid: jest.fn(() => 'ULID-MOCK')}));

import { makeEvent } from '../../src/events/index.js';
import { ulid } from '../../src/utils/id.js';

describe('makeEvent', () => {
  const FIXED_DATE = new Date('2024-01-02T03:04:05.000Z');

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(FIXED_DATE);
    (ulid as jest.Mock).mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('creates an event with generated id, fixed timestamp, payload, and metadata', () => {
    const payload = { a: 1, b: 'x' };
    const metadata = { traceId: 't-123', src: 'unit' };

    const evt = makeEvent('com.example.ThingHappened', payload, metadata);

    expect(ulid).toHaveBeenCalledTimes(1);
    expect(evt).toEqual({
      id: 'ULID-MOCK',
      type: 'com.example.ThingHappened',
      occurredAt: '2024-01-02T03:04:05.000Z',
      payload,
      metadata});
  });

  it('omits metadata when not provided', () => {
    const evt = makeEvent('com.test.NoMeta', { ok: true });

    expect(evt.metadata).toBeUndefined();
    expect(evt.id).toBe('ULID-MOCK');
    expect(evt.occurredAt).toBe('2024-01-02T03:04:05.000Z');
  });
});
