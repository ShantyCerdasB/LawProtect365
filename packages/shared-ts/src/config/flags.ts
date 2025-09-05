/**
 * Feature flags loader from environment variables using "FF_" prefix.
 * Example: FF_ENABLE_METRICS=1, FF_DEBUG_CORS=true
 */

/**
 * Parses feature flags from process.env using the given prefix.
 * Normalizes truthy forms: "1", "true", "yes", "on".
 * @param prefix Environment prefix (default "FF_").
 */
export const loadFeatureFlags = (prefix = "FF_"): Record<string, boolean> => {
  const flags: Record<string, boolean> = {};
  for (const [k, v] of Object.entries(process.env)) {
    if (!k.startsWith(prefix) || v == null) continue;
    const name = k.slice(prefix.length);
    const val = typeof v === "string" ? v.toLowerCase() : String(v).toLowerCase();
    flags[name] = ["1", "true", "yes", "on"].includes(val);
  }
  return flags;
};
