/**
 * @file Permission.ts
 * @summary Generic permission levels for resource access control
 * @description Generic permission enumeration that can be used across all microservices
 * for access control and authorization. Provides a standardized way to define
 * permission levels for any resource.
 */

/**
 * Generic permission level enumeration
 * 
 * Defines standard permission levels that can be applied to any resource
 * across all microservices. These permissions provide a consistent
 * authorization model throughout the system.
 */
export enum PermissionLevel {
  /**
   * Owner permission - Full access to the resource
   * - Can view, edit, delete, manage
   * - Can grant permissions to others
   * - Has complete control over the resource
   */
  OWNER = 'OWNER',

  /**
   * Admin permission - Administrative access
   * - Can view, edit, manage (but not delete)
   * - Can manage users and permissions
   * - Cannot transfer ownership
   */
  ADMIN = 'ADMIN',

  /**
   * Editor permission - Can modify the resource
   * - Can view and edit content
   * - Cannot delete or manage permissions
   * - Cannot access sensitive information
   */
  EDITOR = 'EDITOR',

  /**
   * Viewer permission - Read-only access
   * - Can view resource details and content
   * - Cannot modify anything
   * - Cannot access sensitive information
   */
  VIEWER = 'VIEWER',

  /**
   * Participant permission - Can interact with the resource
   * - Can perform specific actions (e.g., sign, vote, comment)
   * - Cannot modify the resource itself
   * - Limited access to information
   */
  PARTICIPANT = 'PARTICIPANT'
}

/**
 * Valid permissions for each permission level
 */
export const PERMISSION_HIERARCHY: Record<PermissionLevel, PermissionLevel[]> = {
  [PermissionLevel.OWNER]: [
    PermissionLevel.OWNER,
    PermissionLevel.ADMIN,
    PermissionLevel.EDITOR,
    PermissionLevel.VIEWER,
    PermissionLevel.PARTICIPANT
  ],
  [PermissionLevel.ADMIN]: [
    PermissionLevel.ADMIN,
    PermissionLevel.EDITOR,
    PermissionLevel.VIEWER,
    PermissionLevel.PARTICIPANT
  ],
  [PermissionLevel.EDITOR]: [
    PermissionLevel.EDITOR,
    PermissionLevel.VIEWER
  ],
  [PermissionLevel.VIEWER]: [
    PermissionLevel.VIEWER
  ],
  [PermissionLevel.PARTICIPANT]: [
    PermissionLevel.PARTICIPANT
  ]
};

/**
 * Checks if a permission is valid
 */
export function isValidPermissionLevel(permission: PermissionLevel): boolean {
  return Object.values(PermissionLevel).includes(permission);
}

/**
 * Gets all valid permission levels
 */
export function getValidPermissionLevels(): PermissionLevel[] {
  return Object.values(PermissionLevel);
}

/**
 * Gets the display name for a permission level
 */
export function getPermissionLevelDisplayName(permission: PermissionLevel): string {
  switch (permission) {
    case PermissionLevel.OWNER:
      return 'Owner';
    case PermissionLevel.ADMIN:
      return 'Administrator';
    case PermissionLevel.EDITOR:
      return 'Editor';
    case PermissionLevel.VIEWER:
      return 'Viewer';
    case PermissionLevel.PARTICIPANT:
      return 'Participant';
    default:
      return 'Unknown Permission Level';
  }
}

/**
 * Checks if a permission level allows a specific operation
 */
export function canPerformOperation(permission: PermissionLevel, operation: string): boolean {
  const operationLower = operation.toLowerCase();
  
  switch (permission) {
    case PermissionLevel.OWNER:
      return true; // Owner can do everything
    case PermissionLevel.ADMIN:
      return !['delete', 'transfer_ownership'].includes(operationLower);
    case PermissionLevel.EDITOR:
      return ['view', 'edit', 'update', 'create'].includes(operationLower);
    case PermissionLevel.VIEWER:
      return ['view', 'read', 'download'].includes(operationLower);
    case PermissionLevel.PARTICIPANT:
      return ['view', 'read', 'participate', 'interact', 'sign'].includes(operationLower);
    default:
      return false;
  }
}

/**
 * Checks if one permission level is higher than another
 */
export function isPermissionLevelHigher(permission1: PermissionLevel, permission2: PermissionLevel): boolean {
  const hierarchy1 = PERMISSION_HIERARCHY[permission1] || [];
  return hierarchy1.includes(permission2) && permission1 !== permission2;
}

/**
 * Gets the highest permission level from a list
 */
export function getHighestPermissionLevel(permissions: PermissionLevel[]): PermissionLevel | null {
  if (permissions.length === 0) return null;
  
  // Check in order of hierarchy
  const hierarchy = [PermissionLevel.OWNER, PermissionLevel.ADMIN, PermissionLevel.EDITOR, PermissionLevel.VIEWER, PermissionLevel.PARTICIPANT];
  
  for (const permission of hierarchy) {
    if (permissions.includes(permission)) {
      return permission;
    }
  }
  
  return null;
}
