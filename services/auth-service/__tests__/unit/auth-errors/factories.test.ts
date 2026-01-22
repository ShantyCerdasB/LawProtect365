/**
 * @fileoverview Auth Error Factories Tests - Unit tests for error factory functions
 * @summary Tests for all error factory functions
 * @description Tests that all error factory functions create the correct error types with proper codes and messages.
 */

import { describe, it, expect } from '@jest/globals';
import {
  mfaAlreadyDisabled,
  mfaVerificationFailed,
  mfaPolicyViolation,
  invalidMfaConfiguration,
  oauthProviderNotSupported,
  oauthAccountAlreadyLinked,
  oauthAccountLinkingFailed,
  oauthLoginFailed,
  invalidAdminQuery,
  cognitoUserDeleteFailed,
  cognitoAttributeUpdateFailed,
  auditEventNotFound,
  auditTrailIncomplete,
  securityViolation,
  suspiciousActivity,
  rateLimitExceeded,
  ipAddressBlocked,
  userAgentBlocked,
  invalidEmailFormat,
  invalidPasswordFormat,
  invalidNameFormat,
  invalidUserData,
  missingRequiredFields,
  databaseConnectionFailed,
  transactionFailed,
  dataIntegrityViolation
} from '../../../src/auth-errors/factories';
import { AuthErrorCodes } from '../../../src/auth-errors/codes';
import {
  ConflictError,
  UnauthorizedError,
  ForbiddenError,
  BadRequestError,
  NotFoundError,
  InternalError,
  TooManyRequestsError
} from '@lawprotect/shared-ts';

describe('Auth Error Factories', () => {
  describe('MFA Error Factories', () => {
    it('should create mfaAlreadyDisabled error', () => {
      const details = { userId: 'test-user-id' };
      const error = mfaAlreadyDisabled(details);
      
      expect(error).toBeInstanceOf(ConflictError);
      expect(error.message).toBe('MFA is already disabled');
      expect(error.code).toBe(AuthErrorCodes.MFA_ALREADY_DISABLED);
      expect((error as any).details).toBe(details);
    });

    it('should create mfaVerificationFailed error', () => {
      const details = { attemptCount: 3 };
      const error = mfaVerificationFailed(details);
      
      expect(error).toBeInstanceOf(UnauthorizedError);
      expect(error.message).toBe('MFA verification failed');
      expect(error.code).toBe(AuthErrorCodes.MFA_VERIFICATION_FAILED);
      expect((error as any).details).toBe(details);
    });

    it('should create mfaPolicyViolation error', () => {
      const details = { policy: 'strict' };
      const error = mfaPolicyViolation(details);
      
      expect(error).toBeInstanceOf(ForbiddenError);
      expect(error.message).toBe('MFA policy violation');
      expect(error.code).toBe(AuthErrorCodes.MFA_POLICY_VIOLATION);
      expect((error as any).details).toBe(details);
    });

    it('should create invalidMfaConfiguration error', () => {
      const details = { reason: 'Invalid TOTP settings' };
      const error = invalidMfaConfiguration(details);
      
      expect(error).toBeInstanceOf(BadRequestError);
      expect(error.message).toBe('Invalid MFA configuration');
      expect(error.code).toBe(AuthErrorCodes.INVALID_MFA_CONFIGURATION);
      expect((error as any).details).toBe(details);
    });
  });

  describe('OAuth Error Factories', () => {
    it('should create oauthProviderNotSupported error', () => {
      const details = { provider: 'FACEBOOK' };
      const error = oauthProviderNotSupported(details);
      
      expect(error).toBeInstanceOf(BadRequestError);
      expect(error.message).toBe('OAuth provider not supported');
      expect(error.code).toBe(AuthErrorCodes.OAUTH_PROVIDER_NOT_SUPPORTED);
      expect((error as any).details).toBe(details);
    });

    it('should create oauthAccountAlreadyLinked error', () => {
      const details = { accountId: 'oauth-123' };
      const error = oauthAccountAlreadyLinked(details);
      
      expect(error).toBeInstanceOf(ConflictError);
      expect(error.message).toBe('OAuth account already linked');
      expect(error.code).toBe(AuthErrorCodes.OAUTH_ACCOUNT_ALREADY_LINKED);
      expect((error as any).details).toBe(details);
    });

    it('should create oauthAccountLinkingFailed error', () => {
      const details = { cause: 'Network error' };
      const error = oauthAccountLinkingFailed(details);
      
      expect(error).toBeInstanceOf(InternalError);
      expect(error.message).toBe('OAuth account linking failed');
      expect(error.code).toBe(AuthErrorCodes.OAUTH_ACCOUNT_LINKING_FAILED);
      expect((error as any).details).toBe(details);
    });

    it('should create oauthLoginFailed error', () => {
      const details = { provider: 'GOOGLE' };
      const error = oauthLoginFailed(details);
      
      expect(error).toBeInstanceOf(UnauthorizedError);
      expect(error.message).toBe('OAuth login failed');
      expect(error.code).toBe(AuthErrorCodes.OAUTH_LOGIN_FAILED);
      expect((error as any).details).toBe(details);
    });
  });

  describe('Admin Error Factories', () => {
    it('should create invalidAdminQuery error', () => {
      const details = { field: 'limit', message: 'Invalid value' };
      const error = invalidAdminQuery(details);
      
      expect(error).toBeInstanceOf(BadRequestError);
      expect(error.message).toBe('Invalid admin query parameters');
      expect(error.code).toBe(AuthErrorCodes.INVALID_ADMIN_QUERY);
      expect((error as any).details).toBe(details);
    });
  });

  describe('Cognito Error Factories', () => {
    it('should create cognitoUserDeleteFailed error', () => {
      const details = { userId: 'user-123', cause: 'Permission denied' };
      const error = cognitoUserDeleteFailed(details);
      
      expect(error).toBeInstanceOf(InternalError);
      expect(error.message).toBe('Cognito user deletion failed');
      expect(error.code).toBe(AuthErrorCodes.COGNITO_USER_DELETE_FAILED);
      expect((error as any).details).toBe(details);
    });

    it('should create cognitoAttributeUpdateFailed error', () => {
      const details = { attribute: 'email', cause: 'Invalid format' };
      const error = cognitoAttributeUpdateFailed(details);
      
      expect(error).toBeInstanceOf(InternalError);
      expect(error.message).toBe('Cognito attribute update failed');
      expect(error.code).toBe(AuthErrorCodes.COGNITO_ATTRIBUTE_UPDATE_FAILED);
      expect((error as any).details).toBe(details);
    });
  });

  describe('Audit Error Factories', () => {
    it('should create auditEventNotFound error', () => {
      const details = { eventId: 'event-123' };
      const error = auditEventNotFound(details);
      
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.message).toBe('Audit event not found');
      expect(error.code).toBe(AuthErrorCodes.AUDIT_EVENT_NOT_FOUND);
      expect((error as any).details).toBe(details);
    });

    it('should create auditTrailIncomplete error', () => {
      const details = { userId: 'user-123', missingEvents: 5 };
      const error = auditTrailIncomplete(details);
      
      expect(error).toBeInstanceOf(ForbiddenError);
      expect(error.message).toBe('Audit trail is incomplete');
      expect(error.code).toBe(AuthErrorCodes.AUDIT_TRAIL_INCOMPLETE);
      expect((error as any).details).toBe(details);
    });
  });

  describe('Security Error Factories', () => {
    it('should create securityViolation error', () => {
      const details = { violation: 'Unauthorized access attempt' };
      const error = securityViolation(details);
      
      expect(error).toBeInstanceOf(ForbiddenError);
      expect(error.message).toBe('Security violation');
      expect(error.code).toBe(AuthErrorCodes.SECURITY_VIOLATION);
      expect((error as any).details).toBe(details);
    });

    it('should create suspiciousActivity error', () => {
      const details = { activity: 'Multiple failed login attempts' };
      const error = suspiciousActivity(details);
      
      expect(error).toBeInstanceOf(ForbiddenError);
      expect(error.message).toBe('Suspicious activity detected');
      expect(error.code).toBe(AuthErrorCodes.SUSPICIOUS_ACTIVITY);
      expect((error as any).details).toBe(details);
    });

    it('should create rateLimitExceeded error', () => {
      const details = { limit: 100, window: '1 hour' };
      const error = rateLimitExceeded(details);
      
      expect(error).toBeInstanceOf(TooManyRequestsError);
      expect(error.message).toBe('Rate limit exceeded');
      expect(error.code).toBe(AuthErrorCodes.RATE_LIMIT_EXCEEDED);
      expect((error as any).details).toBe(details);
    });

    it('should create ipAddressBlocked error', () => {
      const details = { ip: '192.168.1.1' };
      const error = ipAddressBlocked(details);
      
      expect(error).toBeInstanceOf(ForbiddenError);
      expect(error.message).toBe('IP address is blocked');
      expect(error.code).toBe(AuthErrorCodes.IP_ADDRESS_BLOCKED);
      expect((error as any).details).toBe(details);
    });

    it('should create userAgentBlocked error', () => {
      const details = { userAgent: 'MaliciousBot/1.0' };
      const error = userAgentBlocked(details);
      
      expect(error).toBeInstanceOf(ForbiddenError);
      expect(error.message).toBe('User agent is blocked');
      expect(error.code).toBe(AuthErrorCodes.USER_AGENT_BLOCKED);
      expect((error as any).details).toBe(details);
    });
  });

  describe('Validation Error Factories', () => {
    it('should create invalidEmailFormat error', () => {
      const details = { email: 'invalid-email' };
      const error = invalidEmailFormat(details);
      
      expect(error).toBeInstanceOf(BadRequestError);
      expect(error.message).toBe('Invalid email format');
      expect(error.code).toBe(AuthErrorCodes.INVALID_EMAIL_FORMAT);
      expect((error as any).details).toBe(details);
    });

    it('should create invalidPasswordFormat error', () => {
      const details = { reason: 'Password too short' };
      const error = invalidPasswordFormat(details);
      
      expect(error).toBeInstanceOf(BadRequestError);
      expect(error.message).toBe('Invalid password format');
      expect(error.code).toBe(AuthErrorCodes.INVALID_PASSWORD_FORMAT);
      expect((error as any).details).toBe(details);
    });

    it('should create invalidNameFormat error', () => {
      const details = { field: 'firstName', reason: 'Contains invalid characters' };
      const error = invalidNameFormat(details);
      
      expect(error).toBeInstanceOf(BadRequestError);
      expect(error.message).toBe('Invalid name format');
      expect(error.code).toBe(AuthErrorCodes.INVALID_NAME_FORMAT);
      expect((error as any).details).toBe(details);
    });

    it('should create invalidUserData error', () => {
      const details = { fields: ['email', 'name'] };
      const error = invalidUserData(details);
      
      expect(error).toBeInstanceOf(BadRequestError);
      expect(error.message).toBe('Invalid user data');
      expect(error.code).toBe(AuthErrorCodes.INVALID_USER_DATA);
      expect((error as any).details).toBe(details);
    });

    it('should create missingRequiredFields error', () => {
      const details = { fields: ['email', 'password'] };
      const error = missingRequiredFields(details);
      
      expect(error).toBeInstanceOf(BadRequestError);
      expect(error.message).toBe('Missing required fields');
      expect(error.code).toBe(AuthErrorCodes.MISSING_REQUIRED_FIELDS);
      expect((error as any).details).toBe(details);
    });
  });

  describe('Repository Error Factories', () => {
    it('should create databaseConnectionFailed error', () => {
      const details = { host: 'localhost', port: 5432 };
      const error = databaseConnectionFailed(details);
      
      expect(error).toBeInstanceOf(InternalError);
      expect(error.message).toBe('Database connection failed');
      expect(error.code).toBe(AuthErrorCodes.DATABASE_CONNECTION_FAILED);
      expect((error as any).details).toBe(details);
    });

    it('should create transactionFailed error', () => {
      const details = { operation: 'user_creation', cause: 'Deadlock detected' };
      const error = transactionFailed(details);
      
      expect(error).toBeInstanceOf(InternalError);
      expect(error.message).toBe('Transaction failed');
      expect(error.code).toBe(AuthErrorCodes.TRANSACTION_FAILED);
      expect((error as any).details).toBe(details);
    });

    it('should create dataIntegrityViolation error', () => {
      const details = { constraint: 'unique_email', table: 'users' };
      const error = dataIntegrityViolation(details);
      
      expect(error).toBeInstanceOf(ConflictError);
      expect(error.message).toBe('Data integrity violation');
      expect(error.code).toBe(AuthErrorCodes.DATA_INTEGRITY_VIOLATION);
      expect((error as any).details).toBe(details);
    });
  });

  describe('Error factories with undefined details', () => {
    it('should work without details parameter', () => {
      expect(mfaAlreadyDisabled()).toBeInstanceOf(ConflictError);
      expect(mfaVerificationFailed()).toBeInstanceOf(UnauthorizedError);
      expect(mfaPolicyViolation()).toBeInstanceOf(ForbiddenError);
      expect(invalidMfaConfiguration()).toBeInstanceOf(BadRequestError);
      expect(oauthProviderNotSupported()).toBeInstanceOf(BadRequestError);
      expect(oauthAccountAlreadyLinked()).toBeInstanceOf(ConflictError);
      expect(oauthAccountLinkingFailed()).toBeInstanceOf(InternalError);
      expect(oauthLoginFailed()).toBeInstanceOf(UnauthorizedError);
      expect(invalidAdminQuery()).toBeInstanceOf(BadRequestError);
      expect(cognitoUserDeleteFailed()).toBeInstanceOf(InternalError);
      expect(cognitoAttributeUpdateFailed()).toBeInstanceOf(InternalError);
      expect(auditEventNotFound()).toBeInstanceOf(NotFoundError);
      expect(auditTrailIncomplete()).toBeInstanceOf(ForbiddenError);
      expect(securityViolation()).toBeInstanceOf(ForbiddenError);
      expect(suspiciousActivity()).toBeInstanceOf(ForbiddenError);
      expect(rateLimitExceeded()).toBeInstanceOf(TooManyRequestsError);
      expect(ipAddressBlocked()).toBeInstanceOf(ForbiddenError);
      expect(userAgentBlocked()).toBeInstanceOf(ForbiddenError);
      expect(invalidEmailFormat()).toBeInstanceOf(BadRequestError);
      expect(invalidPasswordFormat()).toBeInstanceOf(BadRequestError);
      expect(invalidNameFormat()).toBeInstanceOf(BadRequestError);
      expect(invalidUserData()).toBeInstanceOf(BadRequestError);
      expect(missingRequiredFields()).toBeInstanceOf(BadRequestError);
      expect(databaseConnectionFailed()).toBeInstanceOf(InternalError);
      expect(transactionFailed()).toBeInstanceOf(InternalError);
      expect(dataIntegrityViolation()).toBeInstanceOf(ConflictError);
    });
  });
});











