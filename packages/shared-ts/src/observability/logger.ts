import { deepRedact } from "./redact.js";
import { getRequestId, getTraceId, getRequestContext } from "./context.js";

/** Log severity. */
export type LogLevel = "debug" | "info" | "warn" | "error";

/**
 * Structured logger interface.
 */
export interface Logger {
  /** Current minimum level. */
  level: LogLevel;
  /** Creates a child logger with additional bound fields. */
  child(bindings: Fields): Logger;
  /** Adds fields for a single log call. */
  withFields(fields: Fields): Logger;
  debug(msg: string, fields?: Fields): void;
  info(msg: string, fields?: Fields): void;
  warn(msg: string, fields?: Fields): void;
  error(msg: string, fields?: Fields): void;
}

/** Arbitrary key-value fields attached to log entries. */
export type Fields = Record<string, unknown>;

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
};

const envLevel = (process.env.LOG_LEVEL ?? "info").toLowerCase() as LogLevel;
const GLOBAL_LEVEL: LogLevel = (["debug", "info", "warn", "error"] as const).includes(envLevel)
  ? envLevel
  : "info";

/**
 * Creates a structured JSON logger that writes to stdout/stderr.
 * @param baseFields Bound fields added to every log entry.
 * @param level Minimum level (defaults to LOG_LEVEL or "info").
 */
export const createLogger = (baseFields: Fields = {}, level: LogLevel = GLOBAL_LEVEL): Logger => {
  const bound = { ...baseFields };

  const emit = (lvl: LogLevel, msg: string, fields?: Fields) => {
    if (LEVEL_ORDER[lvl] < LEVEL_ORDER[level]) return;

    const ctx = getRequestContext();
    const record = deepRedact({
      level: lvl,
      msg,
      time: new Date().toISOString(),
      requestId: ctx?.requestId ?? getRequestId(),
      traceId: ctx?.traceId ?? getTraceId(),
      ...bound,
      ...ctx?.fields,
      ...fields
    });

    const line = JSON.stringify(record);
    if (lvl === "error" || lvl === "warn") {
      console.error(line);
    } else {
      console.log(line);
    }
  };

  const api: Logger = {
    level,
    child(extra: Fields): Logger {
      return createLogger({ ...bound, ...extra }, level);
    },
    withFields(extra: Fields): Logger {
      return createLogger({ ...bound, ...extra }, level);
    },
    debug: (m, f) => emit("debug", m, f),
    info: (m, f) => emit("info", m, f),
    warn: (m, f) => emit("warn", m, f),
    error: (m, f) => emit("error", m, f)
  };

  return api;
};

/**
 * Shared process-wide logger with default level from environment.
 */
export const logger = createLogger();
