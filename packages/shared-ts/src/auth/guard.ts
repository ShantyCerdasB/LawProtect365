import type { ApiEvent } from "@http/httpTypes.js";
import type { AuthContext } from "../types/auth.js";
import type { Permission } from "../types/security.js";
import { ErrorCodes } from "@errors/codes.js";

/**
 * Retrieves the attached AuthContext or throws an Unauthorized error-like object.
 * @param evt API event with auth injected by middleware.
 */
export const requireAuth = (evt: ApiEvent): AuthContext => {
  const auth = (evt as any).auth as AuthContext | undefined;
  if (!auth) throw makeUnauthorized("Missing authentication");
  return auth;
};

/**
 * Asserts that the subject has all required scopes.
 * @param evt API event with auth context.
 * @param scopes Required scopes.
 */
export const requireScopes = (evt: ApiEvent, scopes: string[]): AuthContext => {
  const auth = requireAuth(evt);
  const set = new Set(auth.scopes ?? []);
  const ok = scopes.every((s) => set.has(s));
  if (!ok) throw makeForbidden("Insufficient scopes");
  return auth;
};

/**
 * Asserts that the subject has all required permissions.
 * @param evt API event with auth context.
 * @param perms Required permissions ("resource:action").
 */
export const requirePermissions = (evt: ApiEvent, perms: Permission[]): AuthContext => {
  const auth = requireAuth(evt);
  const set = new Set(auth.permissions ?? []);
  const ok = perms.every((p) => set.has(p));
  if (!ok) throw makeForbidden("Insufficient permissions");
  return auth;
};

/**
 * Asserts tenant equivalence between subject and expected tenant id.
 * @param evt API event with auth context.
 * @param tenantId Expected tenant id.
 */
export const requireTenant = (evt: ApiEvent, tenantId: string): AuthContext => {
  const auth = requireAuth(evt);
  if (!auth.tenantId || auth.tenantId !== tenantId) {
    throw makeForbidden("Tenant mismatch");
  }
  return auth;
};

const makeUnauthorized = (message: string) => {
  const e: any = new Error(message);
  e.name = "UnauthorizedError";
  e.statusCode = 401;
  e.code = ErrorCodes.AUTH_UNAUTHORIZED;
  return e;
};

const makeForbidden = (message: string) => {
  const e: any = new Error(message);
  e.name = "ForbiddenError";
  e.statusCode = 403;
  e.code = ErrorCodes.AUTH_FORBIDDEN;
  return e;
};
