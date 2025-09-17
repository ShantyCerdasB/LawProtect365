/**
 * @fileoverview SignaturePermissionMiddleware - Signature-specific permission validation
 * @summary Permission validation middleware for signature service
 * @description Validates signature-specific permissions like download, view, sign, etc.
 * This middleware is specific to the signature service and handles
 * permission validation for signature operations.
 */

import type { BeforeMiddleware } from '@lawprotect/shared-ts';
import { ForbiddenError, UnauthorizedError, ErrorCodes } from '@lawprotect/shared-ts';
import { SignaturePermission, ROLE_PERMISSIONS, INVITATION_PERMISSIONS } from '../domain/enums/SignaturePermission';

/**
 * Permission validation middleware
 * 
 * Validates that the user has the required signature-specific permission.
 * This middleware should be used after authentication and role validation.
 * 
 * @param requiredPermission - Required signature permission
 * @returns BeforeMiddleware that validates permission
 */
export const withSignaturePermission = (requiredPermission: SignaturePermission): BeforeMiddleware => {
  return async (evt) => {
    try {
      const auth = (evt as any).auth;
      const invitationContext = (evt as any).invitationContext;
      
      if (!auth && !invitationContext) {
        throw new UnauthorizedError(
          'Authentication or invitation token required for permission validation',
          ErrorCodes.AUTH_UNAUTHORIZED
        );
      }

      // Check if user has the required permission
      const hasPermission = await checkSignaturePermission(
        requiredPermission,
        auth,
        invitationContext,
        evt
      );

      if (!hasPermission) {
        throw new ForbiddenError(
          `Insufficient permissions. Required permission: ${requiredPermission}`,
          ErrorCodes.AUTH_FORBIDDEN
        );
      }

      console.log(`✅ [PERMISSION DEBUG] Permission validation successful: ${requiredPermission}`);
    } catch (error) {
      console.error(`❌ [PERMISSION DEBUG] Permission validation failed: ${requiredPermission}`, error);
      throw error;
    }
  };
};

/**
 * Multiple permissions validation middleware
 * 
 * Validates that the user has at least one of the required permissions.
 * 
 * @param requiredPermissions - Array of required permissions (user needs at least one)
 * @returns BeforeMiddleware that validates permissions
 */
export const withAnySignaturePermission = (requiredPermissions: SignaturePermission[]): BeforeMiddleware => {
  return async (evt) => {
    try {
      const auth = (evt as any).auth;
      const invitationContext = (evt as any).invitationContext;
      
      if (!auth && !invitationContext) {
        throw new UnauthorizedError(
          'Authentication or invitation token required for permission validation',
          ErrorCodes.AUTH_UNAUTHORIZED
        );
      }

      // Check if user has at least one required permission
      const permissionChecks = await Promise.all(
        requiredPermissions.map(permission =>
          checkSignaturePermission(permission, auth, invitationContext, evt)
        )
      );
      
      const hasAnyPermission = permissionChecks.some(hasPermission => hasPermission);

      if (!hasAnyPermission) {
        throw new ForbiddenError(
          `Insufficient permissions. Required permissions: ${requiredPermissions.join(', ')}`,
          ErrorCodes.AUTH_FORBIDDEN
        );
      }

      console.log(`✅ [PERMISSION DEBUG] Any permission validation successful: ${requiredPermissions.join(', ')}`);
    } catch (error) {
      console.error(`❌ [PERMISSION DEBUG] Any permission validation failed: ${requiredPermissions.join(', ')}`, error);
      throw error;
    }
  };
};

/**
 * Checks if user has the required signature permission
 */
async function checkSignaturePermission(
  requiredPermission: SignaturePermission,
  auth: any,
  invitationContext: any,
  evt: any
): Promise<boolean> {
  // If user has invitation context, check invitation permissions
  if (invitationContext) {
    return checkInvitationPermission(requiredPermission);
  }

  // If user is authenticated, check role-based permissions
  if (auth) {
    return await checkRoleBasedPermission(requiredPermission, auth, evt);
  }

  return false;
}

/**
 * Checks invitation-based permissions
 */
function checkInvitationPermission(
  requiredPermission: SignaturePermission
): boolean {
  // Invitation tokens have limited permissions
  return INVITATION_PERMISSIONS.includes(requiredPermission);
}

/**
 * Checks role-based permissions
 */
async function checkRoleBasedPermission(
  requiredPermission: SignaturePermission,
  auth: any,
  evt: any
): Promise<boolean> {
  const userRoles = auth.roles || [];
  
  // Owner permissions (super_admin, admin, or envelope owner)
  if (userRoles.includes('super_admin') || userRoles.includes('admin') || await isEnvelopeOwner(auth, evt)) {
    return true; // Owners can do everything
  }
  
  // Check role-based permissions using the enum
  for (const role of userRoles) {
    const rolePermissions = ROLE_PERMISSIONS[role] || [];
    if (rolePermissions.includes(requiredPermission)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Checks if user is the owner of the envelope
 */
async function isEnvelopeOwner(auth: any, evt: any): Promise<boolean> {
  try {
    // Extract envelope ID from request path or body
    const envelopeId = evt.pathParameters?.envelopeId || 
                      evt.body?.envelopeId || 
                      evt.queryStringParameters?.envelopeId;
    
    if (!envelopeId) {
      return false;
    }
    
    // Import repositories dynamically to avoid circular dependencies
    const { EnvelopeRepository } = await import('../repositories/EnvelopeRepository');
    const { EnvelopeId } = await import('../domain/value-objects/EnvelopeId');
    const { loadConfig } = await import('../config');
    const { createDynamoDBClient } = await import('../utils/dynamodb-client');
    
    const config = loadConfig();
    const ddbClient = createDynamoDBClient(config.dynamodb);
    const envelopeRepository = new EnvelopeRepository(
      config.ddb.envelopesTable,
      ddbClient
    );
    
    // Get envelope and check ownership
    const envelope = await envelopeRepository.getById(new EnvelopeId(envelopeId));
    
    if (!envelope) {
      return false;
    }
    
    return envelope.getOwnerId() === auth.userId;
  } catch (error) {
    console.error('Error checking envelope ownership:', error);
    return false;
  }
}
