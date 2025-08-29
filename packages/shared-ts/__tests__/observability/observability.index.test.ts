/**
 * @file observability.index.test.ts
 * @summary Ensures the observability barrel re-exports the public API (100% line coverage).
 */

import * as Obs from '../../src/observability/index.js';
import * as ContextMod from '../../src/observability/context.js';
import * as LoggerMod from '../../src/observability/logger.js';
import * as MetricsMod from '../../src/observability/metrics.js';
import * as TracingMod from '../../src/observability/tracing.js';
import * as TimersMod from '../../src/observability/timers.js';
import * as RedactMod from '../../src/observability/redact.js';

describe('observability index (barrel) re-exports', () => {
  it('re-exports selected symbols with identity preserved', () => {
    // context
    expect(Obs.withRequestContexts).toBe(ContextMod.withRequestContexts);
    expect(Obs.getRequestContext).toBe(ContextMod.getRequestContext);
    expect(Obs.getRequestId).toBe(ContextMod.getRequestId);
    expect(Obs.getTraceId).toBe(ContextMod.getTraceId);
    expect(Obs.setContextFields).toBe(ContextMod.setContextFields);

    // logger
    expect(Obs.createLogger).toBe(LoggerMod.createLogger);
    expect(Obs.logger).toBe(LoggerMod.logger);

    // metrics
    expect(Obs.putMetrics).toBe(MetricsMod.putMetrics);
    expect(Obs.incr).toBe(MetricsMod.incr);
    expect(Obs.timing).toBe(MetricsMod.timing);

    // tracing
    expect(Obs.startSpan).toBe(TracingMod.startSpan);
    expect(Obs.runWithSpan).toBe(TracingMod.runWithSpan);

    // timers
    expect(Obs.startTimer).toBe(TimersMod.startTimer);

    // redact
    expect(Obs.deepRedact).toBe(RedactMod.deepRedact);
  });

  it('exposes all runtime named exports from each submodule', () => {
    const assertAllExportsPresent = (mod: Record<string, unknown>) => {
      for (const key of Object.keys(mod)) {
        if (key === 'default' || key === '__esModule') continue;
        expect(Object.prototype.hasOwnProperty.call(Obs, key)).toBe(true);
      }
    };

    assertAllExportsPresent(ContextMod);
    assertAllExportsPresent(LoggerMod);
    assertAllExportsPresent(MetricsMod);
    assertAllExportsPresent(TracingMod);
    assertAllExportsPresent(TimersMod);
    assertAllExportsPresent(RedactMod);
  });

  it('smoke-tests a few re-exported helpers via the barrel', () => {
    // deepRedact smoke
    expect(Obs.deepRedact({ password: 'x', keep: 1 })).toEqual({ password: '[REDACTED]', keep: 1 });

    // startTimer smoke (deterministic)
    const hrSpy = jest.spyOn(process.hrtime as unknown as { bigint: () => bigint }, 'bigint')
      .mockReturnValueOnce(0n)           // at start
      .mockReturnValueOnce(2_500_000n);  // at end -> 2.5ms
    const t = Obs.startTimer();
    expect(t.end()).toBe(2.5);
    hrSpy.mockRestore();

    // metrics smoke
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined as any);
    Obs.putMetrics('Ns', [{ name: 'Requests', unit: 'Count', value: 1 }], { Service: 'obs' }, 123);
    expect(logSpy).toHaveBeenCalledTimes(1);
    const obj = JSON.parse(logSpy.mock.calls[0][0] as string);
    expect(obj._aws.Timestamp).toBe(123);
    expect(obj.Requests).toBe(1);
    logSpy.mockRestore();

    // logger smoke
    const outSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined as any);
    const lg = Obs.createLogger({}, 'info');
    lg.info('hello');
    expect(outSpy).toHaveBeenCalled();
    outSpy.mockRestore();
  });
});
