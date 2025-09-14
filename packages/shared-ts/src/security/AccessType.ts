/**
 * @file AccessType.ts
 * @summary Generic access types for resource access control
 * @description Generic access type enumeration that can be used across all microservices
 * for defining how users access resources. Provides a standardized way to categorize
 * different access methods and contexts.
 */

/**
 * Access type enumeration
 * 
 * Defines the different methods and contexts through which users can access resources.
 * These types are used for security validation, audit logging, and access control
 * across all microservices.
 */
export enum AccessType {
  /**
   * Direct access - User has direct permission to the resource
   * - Owner accessing their own resource
   * - User with explicit permissions
   * - Internal system access
   */
  DIRECT = 'DIRECT',

  /**
   * Shared link access - User accessing via a shared link
   * - Viewer accessing via shared resource link
   * - Temporary access with limited permissions
   * - Public or semi-public access
   */
  SHARED_LINK = 'SHARED_LINK',

  /**
   * Invitation access - User accessing via invitation
   * - Participant accessing via email invitation
   * - External user with invitation token
   * - Time-limited access
   */
  INVITATION = 'INVITATION',

  /**
   * System access - System or service accessing the resource
   * - Background processes
   * - Automated workflows
   * - Internal service calls
   * - Scheduled tasks
   */
  SYSTEM = 'SYSTEM',

  /**
   * API access - Programmatic access via API
   * - Third-party integrations
   * - API clients
   * - Service-to-service communication
   */
  API = 'API',

  /**
   * Public access - Open access to the resource
   * - Public resources
   * - Anonymous access
   * - No authentication required
   */
  PUBLIC = 'PUBLIC'
}

/**
 * Valid access types for different permission levels
 */
export const ACCESS_TYPE_PERMISSIONS: Record<AccessType, string[]> = {
  [AccessType.DIRECT]: ['OWNER', 'ADMIN', 'EDITOR', 'VIEWER', 'PARTICIPANT'],
  [AccessType.SHARED_LINK]: ['VIEWER', 'PARTICIPANT'],
  [AccessType.INVITATION]: ['PARTICIPANT', 'VIEWER'],
  [AccessType.SYSTEM]: ['OWNER', 'ADMIN', 'EDITOR', 'VIEWER', 'PARTICIPANT'],
  [AccessType.API]: ['OWNER', 'ADMIN', 'EDITOR', 'VIEWER', 'PARTICIPANT'],
  [AccessType.PUBLIC]: ['VIEWER', 'PARTICIPANT']
};

/**
 * Checks if an access type is valid for a given permission
 */
export function isValidAccessTypeForPermission(accessType: AccessType, permission: string): boolean {
  const allowedPermissions = ACCESS_TYPE_PERMISSIONS[accessType] || [];
  return allowedPermissions.includes(permission);
}

/**
 * Gets all valid access types for a given permission
 */
export function getValidAccessTypesForPermission(permission: string): AccessType[] {
  const validAccessTypes: AccessType[] = [];
  
  for (const [accessType, permissions] of Object.entries(ACCESS_TYPE_PERMISSIONS)) {
    if (permissions.includes(permission)) {
      validAccessTypes.push(accessType as AccessType);
    }
  }
  
  return validAccessTypes;
}

/**
 * Gets the display name for an access type
 */
export function getAccessTypeDisplayName(accessType: AccessType): string {
  switch (accessType) {
    case AccessType.DIRECT:
      return 'Direct Access';
    case AccessType.SHARED_LINK:
      return 'Shared Link';
    case AccessType.INVITATION:
      return 'Invitation';
    case AccessType.SYSTEM:
      return 'System Access';
    case AccessType.API:
      return 'API Access';
    case AccessType.PUBLIC:
      return 'Public Access';
    default:
      return 'Unknown Access Type';
  }
}

/**
 * Checks if an access type requires authentication
 */
export function requiresAuthentication(accessType: AccessType): boolean {
  return accessType !== AccessType.PUBLIC;
}

/**
 * Checks if an access type requires authorization
 */
export function requiresAuthorization(accessType: AccessType): boolean {
  return accessType !== AccessType.PUBLIC && accessType !== AccessType.SYSTEM;
}

/**
 * Gets the security level for an access type
 */
export function getAccessTypeSecurityLevel(accessType: AccessType): 'HIGH' | 'MEDIUM' | 'LOW' {
  switch (accessType) {
    case AccessType.DIRECT:
    case AccessType.SYSTEM:
      return 'HIGH';
    case AccessType.INVITATION:
    case AccessType.API:
      return 'MEDIUM';
    case AccessType.SHARED_LINK:
    case AccessType.PUBLIC:
      return 'LOW';
    default:
      return 'LOW';
  }
}
