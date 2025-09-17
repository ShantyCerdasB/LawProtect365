/**
 * @fileoverview SignaturePermission enum - Defines signature-specific permissions
 * @summary Enumerates the permissions for signature operations
 * @description The SignaturePermission enum defines all possible permissions
 * that can be granted for signature operations, used for authorization.
 */

/**
 * Signature-specific permissions enumeration
 * 
 * Defines all possible permissions for signature operations.
 * These permissions are used for authorization and access control.
 */
export enum SignaturePermission {
  /**
   * Can view envelope and document details
   * - Basic read access to envelope information
   */
  VIEW = 'VIEW',

  /**
   * Can download the document
   * - Access to download the PDF document
   */
  DOWNLOAD = 'DOWNLOAD',

  /**
   * Can sign the document
   * - Permission to add digital signature
   */
  SIGN = 'SIGN',

  /**
   * Can decline to sign
   * - Permission to decline signing the document
   */
  DECLINE = 'DECLINE',

  /**
   * Can manage envelope (owner/admin only)
   * - Full management access to envelope
   */
  MANAGE = 'MANAGE',

  /**
   * Can delete envelope (owner only)
   * - Permission to delete the envelope
   */
  DELETE = 'DELETE',

  /**
   * Can send envelope (owner only)
   * - Permission to send envelope for signing
   */
  SEND = 'SEND',

  /**
   * Can cancel envelope (owner only)
   * - Permission to cancel the envelope
   */
  CANCEL = 'CANCEL',

  /**
   * Can view audit history
   * - Access to audit logs and history
   */
  AUDIT = 'AUDIT'
}

/**
 * Permission levels for different user roles
 */
export const ROLE_PERMISSIONS: Record<string, SignaturePermission[]> = {
  /**
   * Super admin permissions - can do everything
   */
  super_admin: Object.values(SignaturePermission),

  /**
   * Admin permissions - can manage and audit
   */
  admin: [
    SignaturePermission.VIEW,
    SignaturePermission.DOWNLOAD,
    SignaturePermission.SIGN,
    SignaturePermission.DECLINE,
    SignaturePermission.MANAGE,
    SignaturePermission.SEND,
    SignaturePermission.CANCEL,
    SignaturePermission.AUDIT
  ],

  /**
   * Lawyer permissions - can sign and audit
   */
  lawyer: [
    SignaturePermission.VIEW,
    SignaturePermission.DOWNLOAD,
    SignaturePermission.SIGN,
    SignaturePermission.DECLINE,
    SignaturePermission.AUDIT
  ],

  /**
   * Customer permissions - basic signing access
   */
  customer: [
    SignaturePermission.VIEW,
    SignaturePermission.DOWNLOAD,
    SignaturePermission.SIGN,
    SignaturePermission.DECLINE
  ]
};

/**
 * Invitation token permissions - limited access for invited signers
 */
export const INVITATION_PERMISSIONS: SignaturePermission[] = [
  SignaturePermission.VIEW,
  SignaturePermission.DOWNLOAD,
  SignaturePermission.SIGN,
  SignaturePermission.DECLINE
];

/**
 * Checks if a role has a specific permission
 */
export function hasPermission(role: string, permission: SignaturePermission): boolean {
  const rolePermissions = ROLE_PERMISSIONS[role] || [];
  return rolePermissions.includes(permission);
}

/**
 * Checks if invitation token has a specific permission
 */
export function hasInvitationPermission(permission: SignaturePermission): boolean {
  return INVITATION_PERMISSIONS.includes(permission);
}
