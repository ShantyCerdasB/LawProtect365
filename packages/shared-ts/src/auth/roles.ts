import type { UserRole } from "../types/auth.js";
import { VALID_COGNITO_ROLES } from "./validRoles.js";

/**
 * Role helpers for hierarchical checks and normalization.
 * @remarks
 * - Replaced `toSorted` with a non-mutating copy-and-sort (`[...arr].sort(...)`) to avoid requiring an ES2023 lib target.
 * - Added explicit comparator parameter types to prevent the "implicitly has an 'any' type" error.
 * - Kept sorting immutable by operating on a shallow copy of the normalized roles array.
 */
export type Role = UserRole;

const ORDER: UserRole[] = [...VALID_COGNITO_ROLES];

/**
 * Returns true when the subject has at least the required role in the hierarchy.
 * @param roles Subject roles (arbitrary strings).
 * @param required Required minimum role.
 */
export const hasAtLeastRole = (roles: string[], required: UserRole): boolean =>
  rank(maxRole(roles)) >= rank(required);

/**
 * Returns the strongest normalized role the subject has, or "client" when none matches.
 * @param roles Subject roles (arbitrary strings).
 */
export const maxRole = (roles: string[]): UserRole => {
  const normalized = normalizeRoles(roles);
  const sorted: UserRole[] = [...normalized].sort(
    (a: UserRole, b: UserRole) => rank(b) - rank(a)
  );
  const best = sorted[0];
  return best ?? "client";
};

/**
 * Checks membership for an exact role.
 * @param roles Subject roles.
 * @param role Exact role.
 */
export const hasRole = (roles: string[], role: UserRole): boolean =>
  normalizeRoles(roles).includes(role);

/**
 * Converts an arbitrary role-like string into a UserRole or undefined.
 * @param r Arbitrary role string.
 */
export const toRole = (r: string): UserRole | undefined => {
  const x = r.toLowerCase();
  if (x === "super_admin" || x === "super-admin") return "super_admin";
  if (x === "admin") return "admin";
  if (x === "lawyer" || x === "abogado") return "lawyer";
  if (x === "customer" || x === "cliente" || x === "client") return "customer";
  if (x === "system") return "system";
  return undefined;
};

/**
 * Normalizes arbitrary role strings into the canonical UserRole list.
 * @param roles Subject roles (arbitrary strings).
 */
export const normalizeRoles = (roles: string[]): UserRole[] =>
  roles.map(toRole).filter(Boolean) as UserRole[];

/** Returns the index rank for hierarchical comparison. Lower index = weaker role. */
const rank = (r: UserRole) => ORDER.indexOf(r as Exclude<UserRole, "system">);
