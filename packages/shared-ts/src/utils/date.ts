/**
 * Date/time utilities for ISO formatting, parsing, arithmetic and comparisons.
 * All helpers are timezone-agnostic unless explicitly named with UTC.
 */

import { ISODateString } from "@/index.js";
import { z } from "@/validation/z.js";

/** Returns current time as ISO-8601 string. */
export const nowIso = (): string => new Date().toISOString();

/**
 * Formats a Date or epoch millis as ISO-8601.
 * @param value Date instance or milliseconds since epoch.
 */
export const toIso = (value: Date | number): string =>
  (value instanceof Date ? value : new Date(value)).toISOString();

/**
 * Parses an ISO-8601 string into a Date. Returns undefined on invalid input.
 * @param iso ISO-8601 string.
 */
export const fromIso = (iso: string | undefined | null): Date | undefined => {
  if (!iso) return undefined;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? undefined : d;
};

/** Converts Date to epoch milliseconds. */
export const toMillis = (d: Date): number => d.getTime();

/**
 * Adds milliseconds to a date and returns a new Date.
 * @param d Input date.
 * @param ms Milliseconds to add (negative to subtract).
 */
export const addMs = (d: Date, ms: number): Date => new Date(d.getTime() + ms);

/** Adds minutes to a date. */
export const addMinutes = (d: Date, minutes: number): Date => addMs(d, minutes * 60_000);

/** Adds days to a date. */
export const addDays = (d: Date, days: number): Date => addMs(d, days * 86_400_000);

/**
 * Returns the UTC start of day (00:00:00.000) for the given date.
 * @param d Input date.
 */
export const startOfDayUTC = (d: Date): Date =>
  new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));

/**
 * Returns the UTC end of day (23:59:59.999) for the given date.
 * @param d Input date.
 */
export const endOfDayUTC = (d: Date): Date =>
  new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));

/**
 * Difference in milliseconds between two dates: a - b.
 * @param a Left date.
 * @param b Right date.
 */
export const diffMs = (a: Date, b: Date): number => a.getTime() - b.getTime();

/**
 * Formats a date as YYYY-MM-DD using UTC components.
 * @param d Input date.
 */
export const formatDateUTC = (d: Date): string => {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const iso = z.string().datetime({ offset: true });

/** Validate and brand a required ISO string. */
export const asISO = (s: string): ISODateString => iso.parse(s) as ISODateString;

/** Validate and brand an optional ISO string (passthrough undefined). */
export const asISOOpt = (s?: string | null): ISODateString | undefined =>
  typeof s === "string" && s.length > 0 ? (iso.parse(s) as ISODateString) : undefined;