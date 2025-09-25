/**
 * @fileoverview RoleMappingPolicy - Role mapping from external IdP groups
 * @summary Policy for mapping external IdP groups to user roles
 * @description Maps Cognito groups to user roles with precedence handling.
 */

import { UserRoleVO } from "../value-objects/UserRoleVO";
import { roleAmbiguousFromIdp } from "../../UserServiceErrors";
import { UserRole } from "@prisma/client";

/**
 * Role mapping policy
 * 
 * Maps external IdP groups (Cognito groups) to user roles with precedence handling.
 * Resolves conflicts by using role hierarchy precedence.
 * 
 * @example
 * ```ts
 * const policy = new RoleMappingPolicy();
 * const role = policy.mapFromCognitoGroups(["admin", "lawyer"]);
 * console.log(role.getValue()); // "ADMIN" (higher precedence)
 * ```
 */
export class RoleMappingPolicy {
  private static readonly ROLE_PRECEDENCE: Record<UserRole, number> = {
    [UserRole.SUPER_ADMIN]: 4,
    [UserRole.ADMIN]: 3,
    [UserRole.LAWYER]: 2,
    [UserRole.CUSTOMER]: 1,
    [UserRole.EXTERNAL_USER]: 0
  };

  private static readonly GROUP_TO_ROLE_MAP: Record<string, UserRole> = {
    "super-admin": UserRole.SUPER_ADMIN,
    "admin": UserRole.ADMIN,
    "lawyer": UserRole.LAWYER,
    "customer": UserRole.CUSTOMER,
    "external-user": UserRole.EXTERNAL_USER
  };

  /**
   * Maps Cognito groups to a user role
   * @param groups - Array of Cognito group names
   * @returns The mapped user role (highest precedence)
   * @throws roleAmbiguousFromIdp when multiple high-precedence groups conflict
   */
  mapFromCognitoGroups(groups: string[]): UserRoleVO {
    if (!groups || groups.length === 0) {
      return UserRoleVO.fromString(UserRole.CUSTOMER); // Default role
    }

    // Map groups to roles
    const mappedRoles = groups
      .map(group => RoleMappingPolicy.GROUP_TO_ROLE_MAP[group.toLowerCase()])
      .filter(role => role !== undefined);

    if (mappedRoles.length === 0) {
      return UserRoleVO.fromString(UserRole.CUSTOMER); // Default role
    }

    // Find the role with highest precedence
    const highestPrecedenceRole = mappedRoles.reduce((highest, current) => {
      const currentPrecedence = RoleMappingPolicy.ROLE_PRECEDENCE[current];
      const highestPrecedence = RoleMappingPolicy.ROLE_PRECEDENCE[highest];
      
      return currentPrecedence > highestPrecedence ? current : highest;
    }, mappedRoles[0]); // Start with first role as initial value

    // Check for ambiguous high-precedence roles
    const highPrecedenceRoles = mappedRoles.filter(
      role => RoleMappingPolicy.ROLE_PRECEDENCE[role] >= 3 // ADMIN or SUPER_ADMIN
    );

    if (highPrecedenceRoles.length > 1) {
      // Check if there are conflicting high-precedence roles
      const uniqueHighPrecedenceRoles = Array.from(new Set(highPrecedenceRoles));
      if (uniqueHighPrecedenceRoles.length > 1) {
        throw roleAmbiguousFromIdp({
          groups,
          mappedRoles: uniqueHighPrecedenceRoles,
          resolvedRole: highestPrecedenceRole
        });
      }
    }

    return UserRoleVO.fromString(highestPrecedenceRole);
  }
}
