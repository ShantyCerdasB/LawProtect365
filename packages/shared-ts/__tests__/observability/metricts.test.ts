/**
 * @file metrics.test.ts
 * @summary Tests for putMetrics, incr, and timing (100% line & branch coverage).
 */

import { putMetrics, incr, timing } from '../../src/observability/metrics.js';

const FIXED_TS = 1_700_000_000_000; // 2023-11-14T10:13:20.000Z (arbitrary but stable)

let logSpy: jest.SpyInstance;

beforeEach(() => {
  jest.clearAllMocks();
  logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined as any);
  jest.spyOn(Date, 'now').mockReturnValue(FIXED_TS);
});

afterEach(() => {
  logSpy.mockRestore();
  (Date.now as jest.Mock | any).mockRestore?.();
});

const parseLastLine = () => JSON.parse(logSpy.mock.calls.at(-1)?.[0]);

describe('putMetrics', () => {
  it('does nothing when metrics array is empty', () => {
    putMetrics('Acme/Service', [], { Service: 'docs', Env: 'dev' }, FIXED_TS);
    expect(logSpy).not.toHaveBeenCalled();
  });

  it('emits EMF with multiple metrics, includes units only when provided, and attaches dimensions and values', () => {
    putMetrics(
      'Acme/Service',
      [
        { name: 'Requests', unit: 'Count', value: 3 },
        { name: 'Latency', value: 123.4 }, // no unit provided
      ],
      { Service: 'docs', Env: 'dev' },
      FIXED_TS
    );

    expect(logSpy).toHaveBeenCalledTimes(1);
    const obj = parseLastLine();

    // Top-level EMF envelope
    expect(obj).toMatchObject({
      Service: 'docs',
      Env: 'dev',
      Requests: 3,
      Latency: 123.4,
      _aws: {
        Timestamp: FIXED_TS}});

    // CloudWatchMetrics descriptor
    const cwm = obj._aws.CloudWatchMetrics;
    expect(Array.isArray(cwm)).toBe(true);
    expect(cwm).toHaveLength(1);
    expect(cwm[0].Namespace).toBe('Acme/Service');

    // Dimensions are a single array of keys; do not assert order
    const dims: string[] = cwm[0].Dimensions[0];
    expect(new Set(dims)).toEqual(new Set(['Service', 'Env']));

    // Metric definitions: only include Unit when provided
    const defs = cwm[0].Metrics as Array<{ Name: string; Unit?: string }>;
    const reqDef = defs.find((d) => d.Name === 'Requests');
    const latDef = defs.find((d) => d.Name === 'Latency');

    expect(reqDef).toEqual({ Name: 'Requests', Unit: 'Count' });
    expect(latDef).toEqual({ Name: 'Latency' });
  });

  it('uses Date.now() when timestamp is omitted', () => {
    putMetrics('Ns', [{ name: 'X', unit: 'Percent', value: 50 }], { A: 'B' });
    const obj = parseLastLine();
    expect(obj._aws.Timestamp).toBe(FIXED_TS); // from mocked Date.now()
  });
});

describe('incr', () => {
  it('increments a Count metric by default (1)', () => {
    incr('Acme/Service', 'Requests', { Service: 'docs' });
    const obj = parseLastLine();

    const defs = obj._aws.CloudWatchMetrics[0].Metrics as Array<{ Name: string; Unit?: string }>;
    expect(defs).toContainEqual({ Name: 'Requests', Unit: 'Count' });
    expect(obj.Requests).toBe(1);
    expect(obj._aws.CloudWatchMetrics[0].Namespace).toBe('Acme/Service');
  });

  it('increments by a custom amount', () => {
    incr('Acme/Service', 'Requests', { Service: 'docs' }, 5);
    const obj = parseLastLine();
    expect(obj.Requests).toBe(5);
  });
});

describe('timing', () => {
  it('records a timing in milliseconds with proper unit', () => {
    timing('Acme/Service', 'LatencyMs', 237, { Service: 'docs' });
    const obj = parseLastLine();

    const defs = obj._aws.CloudWatchMetrics[0].Metrics as Array<{ Name: string; Unit?: string }>;
    expect(defs).toContainEqual({ Name: 'LatencyMs', Unit: 'Milliseconds' });
    expect(obj.LatencyMs).toBe(237);
  });
});
