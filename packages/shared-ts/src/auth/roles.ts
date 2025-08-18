import type { UserRole } from "../types/auth.js";

/**
 * Role helpers for hierarchical checks and normalization.
 */
export type Role = UserRole; 

const ORDER: UserRole[] = ["client", "lawyer", "admin", "super_admin"];

/**
 * Returns true when subject has at least the required role in the hierarchy.
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
  const best = normalized.sort((a, b) => rank(b) - rank(a))[0];
  return best ?? "client";
}

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
  if (x === "client" || x === "cliente") return "client";
  if (x === "system") return "system"; 
  return undefined;
};

/**
 * Normalizes arbitrary role strings into the canonical UserRole list.
 * @param roles Subject roles (arbitrary strings).
 */
export const normalizeRoles = (roles: string[]): UserRole[] =>
  roles.map(toRole).filter(Boolean) as UserRole[];

const rank = (r: UserRole) => ORDER.indexOf(r as Exclude<UserRole, "system">);
