/**
 * @file tracing.test.ts
 * @summary Unit tests for tracing utilities (startSpan and runWithSpan) with full line & branch coverage.
 */

import * as tracing from '../../src/observability/tracing.js';
import * as context from '../../src/observability/context.js';
import * as timers from '../../src/observability/timers.js';
import * as loggerMod from '../../src/observability/logger.js';

describe('tracing utilities', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('startSpan logs start/event/end, sets/restores parent span id, and merges attributes', () => {
    // Arrange: parent span exists in context
    const getCtxSpy = jest
      .spyOn(context, 'getRequestContext')
      .mockReturnValue({ fields: { spanId: 'PARENT' } } as any);

    const setFieldsSpy = jest
      .spyOn(context, 'setContextFields')
      .mockImplementation(() => {});

    // Fixed duration from timer
    const endFn = jest.fn(() => 250);
    jest.spyOn(timers, 'startTimer').mockReturnValue({ end: endFn } as any);

    const debugSpy = jest.spyOn(loggerMod.logger, 'debug').mockImplementation(() => {});
    const infoSpy = jest.spyOn(loggerMod.logger, 'info').mockImplementation(() => {});

    // Act
    const span = tracing.startSpan('work', { a: 1 });
    span.addEvent('checkpoint', { b: 2 });
    const duration = span.end({ c: 3 });

    // Assert: duration returned from end()
    expect(duration).toBe(250);
    expect(endFn).toHaveBeenCalledTimes(1);

    // Context field management
    expect(getCtxSpy).toHaveBeenCalled();
    expect(setFieldsSpy).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ spanId: expect.any(String), parentSpanId: 'PARENT' })
    );
    expect(setFieldsSpy).toHaveBeenNthCalledWith(2, { spanId: 'PARENT' });

    // Logging: start -> event -> end
    expect(debugSpy).toHaveBeenNthCalledWith(
      1,
      'span.start',
      expect.objectContaining({ span: 'work', spanId: expect.any(String), a: 1 })
    );
    expect(debugSpy).toHaveBeenNthCalledWith(
      2,
      'span.event',
      expect.objectContaining({
        span: 'work',
        spanId: expect.any(String),
        event: 'checkpoint',
        b: 2,
      })
    );
    expect(infoSpy).toHaveBeenCalledWith(
      'span.end',
      expect.objectContaining({
        span: 'work',
        spanId: expect.any(String),
        durationMs: 250,
        a: 1,
        c: 3,
      })
    );

    // Returned span shape
    expect(span).toEqual(
      expect.objectContaining({ id: expect.any(String), name: 'work', attributes: { a: 1 } })
    );
  });

  it('startSpan handles missing parent and no attributes', () => {
    // No parent in context
    jest.spyOn(context, 'getRequestContext').mockReturnValue(undefined as any);
    const setFieldsSpy = jest
      .spyOn(context, 'setContextFields')
      .mockImplementation(() => {});

    // Deterministic duration
    jest.spyOn(timers, 'startTimer').mockReturnValue({ end: () => 1 } as any);

    const debugSpy = jest.spyOn(loggerMod.logger, 'debug').mockImplementation(() => {});
    const infoSpy = jest.spyOn(loggerMod.logger, 'info').mockImplementation(() => {});

    const span = tracing.startSpan('noparent');

    // Ensure start log without attributes
    expect(debugSpy).toHaveBeenCalledWith(
      'span.start',
      expect.objectContaining({ span: 'noparent', spanId: expect.any(String) })
    );

    // parentSpanId is undefined on set, and restored on end
    expect(setFieldsSpy).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ spanId: expect.any(String), parentSpanId: undefined })
    );

    span.end();

    expect(setFieldsSpy).toHaveBeenNthCalledWith(2, { spanId: undefined });
    expect(infoSpy).toHaveBeenCalledWith(
      'span.end',
      expect.objectContaining({ span: 'noparent', spanId: expect.any(String), durationMs: 1 })
    );
  });

  it('runWithSpan returns result and ends the span on success', async () => {
    const end = jest.fn();
    const addEvent = jest.fn();

    const startSpy = jest
      .spyOn(tracing, 'startSpan')
      .mockReturnValue({ end, addEvent } as any);

    const res = await tracing.runWithSpan('job', async () => 'ok');

    expect(res).toBe('ok');
    expect(startSpy).toHaveBeenCalledWith('job');
    expect(addEvent).not.toHaveBeenCalled();
    expect(end).toHaveBeenCalledTimes(1);
    expect(end).toHaveBeenCalledWith(); // no extra attributes on success
  });

  it('runWithSpan records error event, ends with error attr, and rethrows', async () => {
    const end = jest.fn();
    const addEvent = jest.fn();

    jest.spyOn(tracing, 'startSpan').mockReturnValue({ end, addEvent } as any);

    const err = new Error('boom');

    await expect(
      tracing.runWithSpan('job', async () => {
        throw err;
      })
    ).rejects.toBe(err);

    expect(addEvent).toHaveBeenCalledTimes(1);
    expect(addEvent).toHaveBeenCalledWith('error', { message: err.message });
    expect(end).toHaveBeenCalledTimes(1);
    expect(end).toHaveBeenCalledWith({ error: true });
  });
});
