/**
 * @file date.test.ts
 * @summary Tests for date/time utilities: ISO formatting/parsing, arithmetic, and comparisons.
 * @remarks
 * - Uses fake timers to stabilize `nowIso`.
 * - Verifies both Date and epoch-millis inputs for `toIso`.
 * - Covers valid/invalid inputs for `fromIso`.
 * - Ensures arithmetic helpers return new Date instances without mutating inputs.
 * - Asserts UTC-specific helpers (`startOfDayUTC`, `endOfDayUTC`, `formatDateUTC`) use UTC components.
 */

import {
  nowIso,
  toIso,
  fromIso,
  toMillis,
  addMs,
  addMinutes,
  addDays,
  startOfDayUTC,
  endOfDayUTC,
  diffMs,
  formatDateUTC,
  asISO,
  asISOOpt,
} from "../../src/utils/date.js";

describe("nowIso", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("returns current time as ISO-8601 string", () => {
    const fixed = new Date("2020-01-02T03:04:05.678Z");
    jest.useFakeTimers();
    jest.setSystemTime(fixed);
    expect(nowIso()).toBe("2020-01-02T03:04:05.678Z");
  });
});

describe("toIso", () => {
  it("formats a Date instance as ISO-8601", () => {
    const d = new Date("2021-07-15T12:34:56.789Z");
    expect(toIso(d)).toBe("2021-07-15T12:34:56.789Z");
  });

  it("formats epoch milliseconds as ISO-8601", () => {
    const ms = Date.parse("1999-12-31T23:59:59.000Z");
    expect(toIso(ms)).toBe("1999-12-31T23:59:59.000Z");
  });
});

describe("fromIso", () => {
  it("parses a valid ISO-8601 string into Date", () => {
    const iso = "2022-03-04T05:06:07.000Z";
    const d = fromIso(iso)!;
    expect(d).toBeInstanceOf(Date);
    expect(d.toISOString()).toBe(iso);
  });

  it("returns undefined for invalid ISO string", () => {
    expect(fromIso("not-a-date")).toBeUndefined();
  });

  it("returns undefined for empty/undefined/null", () => {
    expect(fromIso("")).toBeUndefined();
    expect(fromIso(undefined)).toBeUndefined();
    expect(fromIso(null)).toBeUndefined();
  });
});

describe("toMillis", () => {
  it("converts Date to epoch milliseconds", () => {
    const d = new Date("2000-01-01T00:00:00.000Z");
    expect(toMillis(d)).toBe(d.getTime());
  });
});

describe("addMs / addMinutes / addDays", () => {
  it("adds milliseconds and returns a new Date", () => {
    const d = new Date("2020-01-01T00:00:00.000Z");
    const r = addMs(d, 1234);
    expect(r.toISOString()).toBe("2020-01-01T00:00:01.234Z");
    expect(r).not.toBe(d); // new instance
    expect(d.toISOString()).toBe("2020-01-01T00:00:00.000Z"); // original unchanged
  });

  it("supports negative milliseconds (subtraction)", () => {
    const d = new Date("2020-01-01T00:00:01.000Z");
    expect(addMs(d, -1000).toISOString()).toBe("2020-01-01T00:00:00.000Z");
  });

  it("adds minutes", () => {
    const d = new Date("2020-01-01T00:00:00.000Z");
    expect(addMinutes(d, 2).toISOString()).toBe("2020-01-01T00:02:00.000Z");
  });

  it("adds days", () => {
    const d = new Date("2020-02-27T12:00:00.000Z");
    expect(addDays(d, 2).toISOString()).toBe("2020-02-29T12:00:00.000Z"); // leap year roll
  });
});

describe("startOfDayUTC / endOfDayUTC", () => {
  it("computes UTC start of day", () => {
    const d = new Date("2023-06-15T12:34:56.789Z");
    const s = startOfDayUTC(d);
    expect(s.toISOString()).toBe("2023-06-15T00:00:00.000Z");
  });

  it("computes UTC end of day", () => {
    const d = new Date("2023-06-15T12:34:56.789Z");
    const e = endOfDayUTC(d);
    expect(e.toISOString()).toBe("2023-06-15T23:59:59.999Z");
  });
});

describe("diffMs", () => {
  it("returns the millisecond difference a - b", () => {
    const a = new Date("2021-01-01T00:00:02.500Z");
    const b = new Date("2021-01-01T00:00:01.000Z");
    expect(diffMs(a, b)).toBe(1500);
    expect(diffMs(b, a)).toBe(-1500);
  });
});

describe("formatDateUTC", () => {
  it("formats date as YYYY-MM-DD using UTC", () => {
    const d = new Date("2020-01-02T23:59:59.999Z");
    expect(formatDateUTC(d)).toBe("2020-01-02");
  });

  it("pads month and day to two digits", () => {
    const d = new Date("1999-03-07T00:00:00.000Z");
    expect(formatDateUTC(d)).toBe("1999-03-07");
  });
});

describe("asISO", () => {
  it("validates and brands a valid ISO string", () => {
    const validIso = "2023-01-01T00:00:00.000Z";
    const result = asISO(validIso);
    expect(result).toBe(validIso);
    expect(typeof result).toBe("string");
  });

  it("throws error for invalid ISO string", () => {
    expect(() => asISO("not-a-date")).toThrow();
  });

  it("throws error for empty string", () => {
    expect(() => asISO("")).toThrow();
  });
});

describe("asISOOpt", () => {
  it("validates and brands a valid ISO string", () => {
    const validIso = "2023-01-01T00:00:00.000Z";
    const result = asISOOpt(validIso);
    expect(result).toBe(validIso);
    expect(typeof result).toBe("string");
  });

  it("returns undefined for undefined input", () => {
    const result = asISOOpt(undefined);
    expect(result).toBeUndefined();
  });

  it("returns undefined for null input", () => {
    const result = asISOOpt(null);
    expect(result).toBeUndefined();
  });

  it("returns undefined for empty string", () => {
    const result = asISOOpt("");
    expect(result).toBeUndefined();
  });

  it("throws error for invalid ISO string", () => {
    expect(() => asISOOpt("not-a-date")).toThrow();
  });
});
