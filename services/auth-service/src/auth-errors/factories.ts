/**
 * @fileoverview Auth Error Factories - Convenience constructors for auth service errors
 * @summary Error factory functions for consistent error handling
 * @description Provides helper functions for creating consistent error instances with 
 * appropriate status codes, error codes, and messages for the auth service domain.
 */

import { 
  BadRequestError,
  ConflictError,
  ForbiddenError,
  InternalError,
  NotFoundError,
  TooManyRequestsError,
  UnauthorizedError,
} from "@lawprotect/shared-ts";
import { AuthErrorCodes } from "./codes";

// ============================================================================
// USER ERRORS
// ============================================================================

/**
 * Creates a NotFoundError for when a user was not found (404).
 */
export const userNotFound = (details?: unknown) =>
  new NotFoundError("User not found", AuthErrorCodes.USER_NOT_FOUND, details);

/**
 * Creates a ConflictError for when a user already exists (409).
 */
export const userAlreadyExists = (details?: unknown) =>
  new ConflictError("User already exists", AuthErrorCodes.USER_ALREADY_EXISTS, details);

/**
 * Creates a ConflictError for invalid user state transitions (409).
 */
export const invalidUserStateTransition = (details?: unknown) =>
  new ConflictError("Invalid user state transition", AuthErrorCodes.USER_INVALID_STATE, details);

/**
 * Creates a ConflictError for when a user is already active (409).
 */
export const userAlreadyActive = (details?: unknown) =>
  new ConflictError("User is already active", AuthErrorCodes.USER_ALREADY_ACTIVE, details);

/**
 * Creates a ConflictError for when a user is already suspended (409).
 */
export const userAlreadySuspended = (details?: unknown) =>
  new ConflictError("User is already suspended", AuthErrorCodes.USER_ALREADY_SUSPENDED, details);

/**
 * Creates a ConflictError for when a user is already deleted (409).
 */
export const userAlreadyDeleted = (details?: unknown) =>
  new ConflictError("User is already deleted", AuthErrorCodes.USER_ALREADY_DELETED, details);

/**
 * Creates an InternalError for when user creation fails (500).
 */
export const userCreationFailed = (details?: unknown) =>
  new InternalError("User creation failed", AuthErrorCodes.USER_CREATION_FAILED, details);

/**
 * Creates an InternalError for when user update fails (500).
 */
export const userUpdateFailed = (details?: unknown) =>
  new InternalError("User update failed", AuthErrorCodes.USER_UPDATE_FAILED, details);

/**
 * Creates an InternalError for when user deletion fails (500).
 */
export const userDeleteFailed = (details?: unknown) =>
  new InternalError("User deletion failed", AuthErrorCodes.USER_DELETE_FAILED, details);

/**
 * Creates a ForbiddenError for when user access is denied (403).
 */
export const userAccessDenied = (details?: unknown) =>
  new ForbiddenError("Access denied to user", AuthErrorCodes.USER_ACCESS_DENIED, details);

/**
 * Creates a BadRequestError for user lifecycle violations (400).
 */
export const userLifecycleViolation = (details?: unknown) =>
  new BadRequestError("User lifecycle violation", AuthErrorCodes.USER_LIFECYCLE_VIOLATION, details);

// ============================================================================
// AUTHENTICATION ERRORS
// ============================================================================

/**
 * Creates an UnauthorizedError for authentication failures (401).
 */
export const authenticationFailed = (details?: unknown) =>
  new UnauthorizedError("Authentication failed", AuthErrorCodes.AUTHENTICATION_FAILED, details);

/**
 * Creates an UnauthorizedError for invalid credentials (401).
 */
export const invalidCredentials = (details?: unknown) =>
  new UnauthorizedError("Invalid credentials", AuthErrorCodes.INVALID_CREDENTIALS, details);

/**
 * Creates a ForbiddenError for locked accounts (403).
 */
export const accountLocked = (details?: unknown) =>
  new ForbiddenError("Account is locked", AuthErrorCodes.ACCOUNT_LOCKED, details);

/**
 * Creates a ForbiddenError for suspended accounts (403).
 */
export const accountSuspended = (details?: unknown) =>
  new ForbiddenError("Account is suspended", AuthErrorCodes.ACCOUNT_SUSPENDED, details);

/**
 * Creates a ForbiddenError for deleted accounts (403).
 */
export const accountDeleted = (details?: unknown) =>
  new ForbiddenError("Account is deleted", AuthErrorCodes.ACCOUNT_DELETED, details);

/**
 * Creates an UnauthorizedError for expired sessions (401).
 */
export const sessionExpired = (details?: unknown) =>
  new UnauthorizedError("Session has expired", AuthErrorCodes.SESSION_EXPIRED, details);

/**
 * Creates an UnauthorizedError for invalid tokens (401).
 */
export const tokenInvalid = (details?: unknown) =>
  new UnauthorizedError("Invalid token", AuthErrorCodes.TOKEN_INVALID, details);

/**
 * Creates an UnauthorizedError for expired tokens (401).
 */
export const tokenExpired = (details?: unknown) =>
  new UnauthorizedError("Token has expired", AuthErrorCodes.TOKEN_EXPIRED, details);

// ============================================================================
// AUTHORIZATION ERRORS
// ============================================================================

/**
 * Creates a ForbiddenError for authorization failures (403).
 */
export const authorizationFailed = (details?: unknown) =>
  new ForbiddenError("Authorization failed", AuthErrorCodes.AUTHORIZATION_FAILED, details);

/**
 * Creates a ForbiddenError for insufficient permissions (403).
 */
export const insufficientPermissions = (details?: unknown) =>
  new ForbiddenError("Insufficient permissions", AuthErrorCodes.INSUFFICIENT_PERMISSIONS, details);

/**
 * Creates an InternalError for role assignment failures (500).
 */
export const roleAssignmentFailed = (details?: unknown) =>
  new InternalError("Role assignment failed", AuthErrorCodes.ROLE_ASSIGNMENT_FAILED, details);

/**
 * Creates an InternalError for role removal failures (500).
 */
export const roleRemovalFailed = (details?: unknown) =>
  new InternalError("Role removal failed", AuthErrorCodes.ROLE_REMOVAL_FAILED, details);

/**
 * Creates a BadRequestError for invalid role assignments (400).
 */
export const invalidRoleAssignment = (details?: unknown) =>
  new BadRequestError("Invalid role assignment", AuthErrorCodes.INVALID_ROLE_ASSIGNMENT, details);

/**
 * Creates a ConflictError for role assignment conflicts (409).
 */
export const roleAssignmentConflict = (details?: unknown) =>
  new ConflictError("Role assignment conflict", AuthErrorCodes.ROLE_ASSIGNMENT_CONFLICT, details);

// ============================================================================
// MFA ERRORS
// ============================================================================

/**
 * Creates a ForbiddenError for missing MFA (403).
 */
export const mfaRequired = (details?: unknown) =>
  new ForbiddenError("MFA is required", AuthErrorCodes.MFA_REQUIRED, details);

/**
 * Creates a BadRequestError for MFA not enabled (400).
 */
export const mfaNotEnabled = (details?: unknown) =>
  new BadRequestError("MFA is not enabled", AuthErrorCodes.MFA_NOT_ENABLED, details);

/**
 * Creates a ConflictError for MFA already enabled (409).
 */
export const mfaAlreadyEnabled = (details?: unknown) =>
  new ConflictError("MFA is already enabled", AuthErrorCodes.MFA_ALREADY_ENABLED, details);

/**
 * Creates a ConflictError for MFA already disabled (409).
 */
export const mfaAlreadyDisabled = (details?: unknown) =>
  new ConflictError("MFA is already disabled", AuthErrorCodes.MFA_ALREADY_DISABLED, details);

/**
 * Creates an UnauthorizedError for MFA verification failures (401).
 */
export const mfaVerificationFailed = (details?: unknown) =>
  new UnauthorizedError("MFA verification failed", AuthErrorCodes.MFA_VERIFICATION_FAILED, details);

/**
 * Creates a ForbiddenError for MFA policy violations (403).
 */
export const mfaPolicyViolation = (details?: unknown) =>
  new ForbiddenError("MFA policy violation", AuthErrorCodes.MFA_POLICY_VIOLATION, details);

/**
 * Creates a BadRequestError for invalid MFA configuration (400).
 */
export const invalidMfaConfiguration = (details?: unknown) =>
  new BadRequestError("Invalid MFA configuration", AuthErrorCodes.INVALID_MFA_CONFIGURATION, details);

// ============================================================================
// OAUTH ERRORS
// ============================================================================

/**
 * Creates a BadRequestError for unsupported OAuth providers (400).
 */
export const oauthProviderNotSupported = (details?: unknown) =>
  new BadRequestError("OAuth provider not supported", AuthErrorCodes.OAUTH_PROVIDER_NOT_SUPPORTED, details);

/**
 * Creates a NotFoundError for OAuth accounts not found (404).
 */
export const oauthAccountNotFound = (details?: unknown) =>
  new NotFoundError("OAuth account not found", AuthErrorCodes.OAUTH_ACCOUNT_NOT_FOUND, details);

/**
 * Creates a ConflictError for OAuth accounts already linked (409).
 */
export const oauthAccountAlreadyLinked = (details?: unknown) =>
  new ConflictError("OAuth account already linked", AuthErrorCodes.OAUTH_ACCOUNT_ALREADY_LINKED, details);

/**
 * Creates an InternalError for OAuth account linking failures (500).
 */
export const oauthAccountLinkingFailed = (details?: unknown) =>
  new InternalError("OAuth account linking failed", AuthErrorCodes.OAUTH_ACCOUNT_LINKING_FAILED, details);

/**
 * Creates an InternalError for OAuth account unlinking failures (500).
 */
export const oauthAccountUnlinkingFailed = (details?: unknown) =>
  new InternalError("OAuth account unlinking failed", AuthErrorCodes.OAUTH_ACCOUNT_UNLINKING_FAILED, details);

/**
 * Creates an UnauthorizedError for OAuth login failures (401).
 */
export const oauthLoginFailed = (details?: unknown) =>
  new UnauthorizedError("OAuth login failed", AuthErrorCodes.OAUTH_LOGIN_FAILED, details);

// ============================================================================
// ADMIN ERRORS
// ============================================================================

/**
 * Creates a ForbiddenError for insufficient admin permissions (403).
 */
export const insufficientAdminPermissions = (details?: unknown) =>
  new ForbiddenError("Insufficient admin permissions", AuthErrorCodes.INSUFFICIENT_ADMIN_PERMISSIONS, details);

/**
 * Creates a BadRequestError for invalid admin query parameters (400).
 */
export const invalidAdminQuery = (details?: unknown) =>
  new BadRequestError("Invalid admin query parameters", AuthErrorCodes.INVALID_ADMIN_QUERY, details);

// ============================================================================
// COGNITO ERRORS
// ============================================================================

/**
 * Creates a NotFoundError for Cognito users not found (404).
 */
export const cognitoUserNotFound = (details?: unknown) =>
  new NotFoundError("Cognito user not found", AuthErrorCodes.COGNITO_USER_NOT_FOUND, details);

/**
 * Creates an InternalError for Cognito user creation failures (500).
 */
export const cognitoUserCreationFailed = (details?: unknown) =>
  new InternalError("Cognito user creation failed", AuthErrorCodes.COGNITO_USER_CREATION_FAILED, details);

/**
 * Creates an InternalError for Cognito user update failures (500).
 */
export const cognitoUserUpdateFailed = (details?: unknown) =>
  new InternalError("Cognito user update failed", AuthErrorCodes.COGNITO_USER_UPDATE_FAILED, details);

/**
 * Creates an InternalError for Cognito user deletion failures (500).
 */
export const cognitoUserDeleteFailed = (details?: unknown) =>
  new InternalError("Cognito user deletion failed", AuthErrorCodes.COGNITO_USER_DELETE_FAILED, details);

/**
 * Creates a BadRequestError for invalid Cognito sub (400).
 */
export const invalidCognitoSub = (details?: unknown) =>
  new BadRequestError("Invalid Cognito sub", AuthErrorCodes.INVALID_COGNITO_SUB, details);

/**
 * Creates an InternalError for Cognito attribute update failures (500).
 */
export const cognitoAttributeUpdateFailed = (details?: unknown) =>
  new InternalError("Cognito attribute update failed", AuthErrorCodes.COGNITO_ATTRIBUTE_UPDATE_FAILED, details);

// ============================================================================
// AUDIT ERRORS
// ============================================================================

/**
 * Creates an InternalError for audit event creation failures (500).
 */
export const auditEventCreationFailed = (details?: unknown) =>
  new InternalError("Audit event creation failed", AuthErrorCodes.AUDIT_EVENT_CREATION_FAILED, details);

/**
 * Creates a NotFoundError for audit events not found (404).
 */
export const auditEventNotFound = (details?: unknown) =>
  new NotFoundError("Audit event not found", AuthErrorCodes.AUDIT_EVENT_NOT_FOUND, details);

/**
 * Creates a ForbiddenError for incomplete audit trails (403).
 */
export const auditTrailIncomplete = (details?: unknown) =>
  new ForbiddenError("Audit trail is incomplete", AuthErrorCodes.AUDIT_TRAIL_INCOMPLETE, details);

// ============================================================================
// SECURITY ERRORS
// ============================================================================

/**
 * Creates a ForbiddenError for security violations (403).
 */
export const securityViolation = (details?: unknown) =>
  new ForbiddenError("Security violation", AuthErrorCodes.SECURITY_VIOLATION, details);

/**
 * Creates a ForbiddenError for suspicious activity (403).
 */
export const suspiciousActivity = (details?: unknown) =>
  new ForbiddenError("Suspicious activity detected", AuthErrorCodes.SUSPICIOUS_ACTIVITY, details);

/**
 * Creates a TooManyRequestsError for rate limit exceeded (429).
 */
export const rateLimitExceeded = (details?: unknown) =>
  new TooManyRequestsError("Rate limit exceeded", AuthErrorCodes.RATE_LIMIT_EXCEEDED, details);

/**
 * Creates a ForbiddenError for blocked IP addresses (403).
 */
export const ipAddressBlocked = (details?: unknown) =>
  new ForbiddenError("IP address is blocked", AuthErrorCodes.IP_ADDRESS_BLOCKED, details);

/**
 * Creates a ForbiddenError for blocked user agents (403).
 */
export const userAgentBlocked = (details?: unknown) =>
  new ForbiddenError("User agent is blocked", AuthErrorCodes.USER_AGENT_BLOCKED, details);

// ============================================================================
// VALIDATION ERRORS
// ============================================================================

/**
 * Creates a BadRequestError for invalid email format (400).
 */
export const invalidEmailFormat = (details?: unknown) =>
  new BadRequestError("Invalid email format", AuthErrorCodes.INVALID_EMAIL_FORMAT, details);

/**
 * Creates a BadRequestError for invalid password format (400).
 */
export const invalidPasswordFormat = (details?: unknown) =>
  new BadRequestError("Invalid password format", AuthErrorCodes.INVALID_PASSWORD_FORMAT, details);

/**
 * Creates a BadRequestError for invalid name format (400).
 */
export const invalidNameFormat = (details?: unknown) =>
  new BadRequestError("Invalid name format", AuthErrorCodes.INVALID_NAME_FORMAT, details);

/**
 * Creates a BadRequestError for invalid user data (400).
 */
export const invalidUserData = (details?: unknown) =>
  new BadRequestError("Invalid user data", AuthErrorCodes.INVALID_USER_DATA, details);

/**
 * Creates a BadRequestError for missing required fields (400).
 */
export const missingRequiredFields = (details?: unknown) =>
  new BadRequestError("Missing required fields", AuthErrorCodes.MISSING_REQUIRED_FIELDS, details);

// ============================================================================
// REPOSITORY ERRORS
// ============================================================================

/**
 * Creates an InternalError for repository failures (500).
 */
export const repositoryError = (details?: unknown) =>
  new InternalError("Repository operation failed", AuthErrorCodes.REPOSITORY_ERROR, details);

/**
 * Creates an InternalError for database connection failures (500).
 */
export const databaseConnectionFailed = (details?: unknown) =>
  new InternalError("Database connection failed", AuthErrorCodes.DATABASE_CONNECTION_FAILED, details);

/**
 * Creates an InternalError for transaction failures (500).
 */
export const transactionFailed = (details?: unknown) =>
  new InternalError("Transaction failed", AuthErrorCodes.TRANSACTION_FAILED, details);

/**
 * Creates a ConflictError for data integrity violations (409).
 */
export const dataIntegrityViolation = (details?: unknown) =>
  new ConflictError("Data integrity violation", AuthErrorCodes.DATA_INTEGRITY_VIOLATION, details);
