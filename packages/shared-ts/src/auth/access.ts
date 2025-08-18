import type { SecurityContext, ResourceRef, Action, Permission } from "../types/security.js";
import { hasRole } from "./roles.js";

/**
 * Default access decision combining role hierarchy, tenant boundary and fine-grained permissions.
 * super_admin → allow all; admin → allow within same tenant; others → require permission or scope.
 *
 * Branding note:
 * - `Permission` and `Scope` are branded strings. To compare with scopes, we de-brand into plain strings.
 *
 * @param subject Security context (roles, tenant, scopes, permissions).
 * @param action Action being attempted.
 * @param resource Target resource reference.
 * @returns True if access is allowed, false otherwise.
 */
export const can = (subject: SecurityContext, action: Action, resource: ResourceRef): boolean => {
  if (hasRole(subject.roles, "super_admin")) return true;

  if (hasRole(subject.roles, "admin")) {
    if (!resource.tenantId || !subject.tenantId) return false;
    if (resource.tenantId !== subject.tenantId) return false;
    return true;
  }

  // Branded permission for Permission[] checks
  const perm = `${resource.resource}:${action}` as Permission;

  // Plain string for Scope[] comparison (de-brand to string[])
  const permStr = `${resource.resource}:${action}`;
  const scopeStrings = (subject.scopes as unknown as ReadonlyArray<string>) ?? [];

  const hasPerm = Boolean(subject.permissions?.includes(perm));
  const hasScope = scopeStrings.includes(permStr);

  return hasPerm || hasScope;
};
