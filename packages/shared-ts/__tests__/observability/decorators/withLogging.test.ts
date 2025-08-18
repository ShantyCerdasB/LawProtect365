/**
 * @file withLogging.test.ts
 * @summary Tests for withLogging decorator (100% line & branch coverage).
 */

import { withLogging } from '../../../src/observability/decorators/withLogging.js';

describe('withLogging', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2020-01-01T00:00:00.000Z'));
  });
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('logs at default "info" level, uses op.name, includes input & output, and measures elapsed ms', async () => {
    const logger = { info: jest.fn(), debug: jest.fn(), error: jest.fn() };
    const ctx = { logger } as any;
    const input = { a: 1 };

    // Named op to verify name inference
    async function doWork(_ctx: any, i: unknown) {
      // Advance time before returning so the wrapper computes a non-zero duration
      jest.setSystemTime(new Date('2020-01-01T00:00:00.500Z'));
      return { echo: i };
    }

    const wrapped = withLogging(doWork, { includeInput: true, includeOutput: true });
    const out = await wrapped(ctx, input);

    expect(out).toEqual({ echo: input });
    expect(logger.info).toHaveBeenNthCalledWith(1, 'doWork:start', { input });
    expect(logger.info).toHaveBeenNthCalledWith(2, 'doWork:ok', { ms: 500, output: { echo: input } });
    expect(logger.debug).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('logs error with elapsed ms, uses "debug" level and custom name, then rethrows', async () => {
    const logger = { info: jest.fn(), debug: jest.fn(), error: jest.fn() };
    const ctx = { logger } as any;
    const err = new Error('fail');

    const failing = async () => {
      // Ensure non-zero elapsed time on failure
      jest.setSystemTime(new Date('2020-01-01T00:00:00.123Z'));
      throw err;
    };

    const wrapped = withLogging(failing, { name: 'customOp', level: 'debug' });

    await expect(wrapped(ctx, { k: 'v' })).rejects.toThrow('fail');

    // includeInput defaults to false → second arg is undefined
    expect(logger.debug).toHaveBeenCalledWith('customOp:start', undefined);
    expect(logger.error).toHaveBeenCalledTimes(1);
    const [, payload] = (logger.error as jest.Mock).mock.calls[0];
    expect(payload).toEqual(expect.objectContaining({ ms: 123 }));
    expect(payload.err).toBe(err);
    expect(logger.info).not.toHaveBeenCalled();
  });

  it('falls back to "operation" name when op is anonymous and excludes output when not requested', async () => {
    const logger = { info: jest.fn(), debug: jest.fn(), error: jest.fn() };
    const ctx = { logger } as any;

    const wrapped = withLogging(
      // Anonymous op triggers default name
      async () => {
        jest.setSystemTime(new Date('2020-01-01T00:00:00.001Z'));
        return 'x';
      }
    );

    const res = await wrapped(ctx, 0);
    expect(res).toBe('x');

    // includeInput defaults to false → undefined payload on start
    expect(logger.info).toHaveBeenNthCalledWith(1, 'operation:start', undefined);
    // includeOutput defaults to false → only ms is logged on ok
    expect(logger.info).toHaveBeenNthCalledWith(2, 'operation:ok', { ms: 1 });
  });
});
