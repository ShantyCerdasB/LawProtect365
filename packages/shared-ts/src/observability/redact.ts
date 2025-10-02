/**
 * Options controlling deep redaction.
 */
export interface RedactOptions {
  /** Case-insensitive field names to redact. */
  fields?: string[];
  /** Replacement token. */
  replacement?: string;
  /** Max depth to traverse (defense against cycles/huge objects). */
  maxDepth?: number;
}

const DEFAULT_FIELDS = [
  "authorization",
  "password",
  "pwd",
  "secret",
  "token",
  "access_token",
  "refresh_token",
  "ssn",
  "cardnumber",
  "cvv",
  "privatekey",
  "apikey"
];

/**
 * Deeply redacts well-known sensitive fields in a structured value.
 * @param value Arbitrary JSON-like value.
 * @param opts Redaction options.
 */
export const deepRedact = <T>(value: T, opts: RedactOptions = {}): T => {
  const fields = new Set((opts.fields ?? DEFAULT_FIELDS).map((s) => s.toLowerCase()));
  const seen = new WeakSet<object>();
  const repl = opts.replacement ?? "[REDACTED]";
  const maxDepth = opts.maxDepth ?? 8;

  const visit = (val: any, depth: number): any => {
    if (depth > maxDepth) return val;
    if (val === null || typeof val !== "object") return val;
    if (seen.has(val)) return val;
    seen.add(val);

    if (Array.isArray(val)) {
      return val.map((v) => visit(v, depth + 1));
    }

    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(val)) {
      if (fields.has(k.toLowerCase())) {
        out[k] = repl;
      } else {
        out[k] = visit(v, depth + 1);
      }
    }
    return out;
  };

  return visit(value, 0);
};
