/**
 * POSIX path helpers for safe joining, normalization and inspection.
 * Uses forward slashes for consistency across platforms and keys.
 * @remarks
 * - Replaced the trailing-slash regex in `ensureTrailingSlash` with a loop-based trim to avoid any risk of super-linear backtracking.
 * - Applied the same loop-based approach to `stripTrailingSlash` for consistency.
 */

import * as nodePath from "node:path";

const p = nodePath.posix;

/**
 * Converts any separators to POSIX-style forward slashes.
 * @param input Path string (may contain backslashes).
 */
export const toPosix = (input: string): string => input.replace(/\\/g, "/");

/**
 * Joins path segments using POSIX semantics.
 * @param parts Path segments.
 */
export const join = (...parts: Array<string | undefined | null>): string =>
  p.join(...parts.filter((x): x is string => Boolean(x)).map((x) => toPosix(x!)));

/**
 * Normalizes a path (collapses '.', '..' and redundant slashes).
 * @param input Path string.
 */
export const normalize = (input: string): string => p.normalize(toPosix(input));

/**
 * Returns the directory name of a path.
 * @param input Path string.
 */
export const dirname = (input: string): string => p.dirname(toPosix(input));

/**
 * Returns the base name (last segment) of a path.
 * @param input Path string.
 */
export const basename = (input: string): string => p.basename(toPosix(input));

/**
 * Returns the extension (including the dot) of a path or "".
 * @param input Path string.
 */
export const extname = (input: string): string => p.extname(toPosix(input));

/**
 * Ensures a single leading slash.
 * @param input Path string.
 */
export const ensureLeadingSlash = (input: string): string =>
  `/${toPosix(input).replace(/^\/+/, "")}`;

/**
 * Removes any leading slashes.
 * @param input Path string.
 */
export const stripLeadingSlash = (input: string): string =>
  toPosix(input).replace(/^\/+/, "");

/**
 * Ensures a single trailing slash.
 * @param input Path string.
 */
export const ensureTrailingSlash = (input: string): string => {
  const s = toPosix(input);
  let end = s.length - 1;
  while (end >= 0 && s[end] === "/") end--;
  return s.slice(0, end + 1) + "/";
};

/**
 * Removes any trailing slashes.
 * @param input Path string.
 */
export const stripTrailingSlash = (input: string): string => {
  const s = toPosix(input);
  let end = s.length - 1;
  while (end >= 0 && s[end] === "/") end--;
  return s.slice(0, end + 1);
};

/**
 * Returns true if `child` is contained within `parent` after normalization.
 * @param parent Parent path.
 * @param child Candidate child path.
 */
export const isSubpath = (parent: string, child: string): boolean => {
  const a = stripTrailingSlash(normalize(parent));
  const b = normalize(child);
  const rel = p.relative(a, b);
  return rel !== "" && !rel.startsWith("..") && !p.isAbsolute(rel);
};

/**
 * Splits a normalized POSIX path into segments.
 * @param input Path string.
 */
export const split = (input: string): string[] =>
  stripLeadingSlash(normalize(input)).split("/").filter(Boolean);
