import type { SecurityContext, ResourceRef, Action, Permission, Scope, PolicyDecision } from "../types/security.js";
import { hasRole } from "./roles.js";

/**
 * Rule function evaluated during authorization.
 */
export type PolicyRule = (
  subject: SecurityContext,
  action: Action,
  resource: ResourceRef
) => boolean | Promise<boolean>;

/**
 * Declarative authorization policy composed of rules.
 */
export class Policy {
  private readonly rules: Array<{ name: string; fn: PolicyRule }> = [];

  /**
   * Adds a named rule to the policy.
   * @param name Stable name for diagnostics.
   * @param fn Predicate returning true to allow.
   */
  addRule(name: string, fn: PolicyRule): this {
    this.rules.push({ name, fn });
    return this;
  }

  /**
   * Evaluates the policy against a request.
   * First rule that returns true grants access.
   * @param subject Caller security context.
   * @param action Action requested.
   * @param resource Target resource reference.
   */
  async evaluate(
    subject: SecurityContext,
    action: Action,
    resource: ResourceRef
  ): Promise<PolicyDecision> {
    for (const { name, fn } of this.rules) {
      // eslint-disable-next-line no-await-in-loop
      const allowed = await fn(subject, action, resource);
      if (allowed) return { effect: "allow", reason: name };
    }
    return { effect: "deny", reason: "no_rule_matched" };
  }
}

/**
 * Allows all actions for super administrators.
 */
export const allowSuperAdmin: PolicyRule = (s) => hasRole(s.roles, "SUPER_ADMIN");


/**
 * Allows when explicit permission or scope is present.
 * Builds "resource:action" and checks in subject permissions/scopes.
 */
export const allowPermissionOrScope: PolicyRule = (s, _action, resource) => {
  const perm = `${resource.resource}:action` as Permission;
  const hasPerm = Boolean(s.permissions?.includes(perm));
  const hasScope = Boolean(s.scopes?.includes(perm as unknown as Scope));
  return hasPerm || hasScope;
};
