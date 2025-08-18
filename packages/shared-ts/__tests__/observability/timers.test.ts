/**
 * @file timers.test.ts
 * @summary Tests for startTimer (100% line coverage).
 */

import { startTimer } from '../../src/observability/timers.js';

describe('startTimer', () => {
  let hrSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    // Spy on process.hrtime.bigint to provide deterministic nanosecond values
    hrSpy = jest.spyOn(process.hrtime as unknown as { bigint: () => bigint }, 'bigint');
  });

  afterEach(() => {
    hrSpy.mockRestore();
  });

  it('returns elapsed milliseconds based on bigint nanosecond delta', () => {
    // start → 100_000ns, end → 250_000ns → delta 150_000ns = 0.15ms
    hrSpy
      .mockReturnValueOnce(100_000n)  // captured at start()
      .mockReturnValueOnce(250_000n); // captured at end()

    const t = startTimer();
    expect(typeof t.end).toBe('function');
    expect(hrSpy).toHaveBeenCalledTimes(1);   // called during start

    const ms = t.end();
    expect(hrSpy).toHaveBeenCalledTimes(2);   // called during end
    expect(typeof ms).toBe('number');
    expect(ms).toBe(0.15);
  });

  it('supports multiple end() calls; each uses current time since the same start', () => {
    // start → 0ns; end1 → 1_000_000ns (1ms); end2 → 10_500_000ns (10.5ms)
    hrSpy
      .mockReturnValueOnce(0n)             // start
      .mockReturnValueOnce(1_000_000n)     // end #1
      .mockReturnValueOnce(10_500_000n);   // end #2

    const t = startTimer();
    const ms1 = t.end();
    const ms2 = t.end();

    expect(ms1).toBe(1);
    expect(ms2).toBe(10.5);
    expect(hrSpy).toHaveBeenCalledTimes(3);
  });
});
