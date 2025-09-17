/**
 * @fileoverview InvitationTokenMiddleware - Invitation token validation middleware
 * @summary Invitation token validation for signature service
 * @description Validates invitation tokens for signer access to envelopes.
 * This middleware is specific to the signature service and handles
 * invitation-based access to signing workflows.
 */

import type { BeforeMiddleware } from '@lawprotect/shared-ts';
import { UnauthorizedError, ErrorCodes } from '@lawprotect/shared-ts';

/**
 * Invitation token validation middleware
 * 
 * Validates invitation tokens for signer access to envelopes.
 * This middleware should be used for endpoints that allow signers
 * to access envelopes via invitation links.
 * 
 * @param tokenHeader - Header name containing the invitation token (default: 'x-invitation-token')
 * @returns BeforeMiddleware that validates invitation token
 */
export const withInvitationToken = (tokenHeader = 'x-invitation-token'): BeforeMiddleware => {
  return async (evt) => {
    try {
      // Extract invitation token from header
      const invitationToken = evt.headers?.[tokenHeader] || 
                             evt.headers?.[tokenHeader.toUpperCase()] ||
                             evt.queryStringParameters?.invitationToken;

      if (!invitationToken) {
        throw new UnauthorizedError(
          `Missing invitation token in header: ${tokenHeader}`,
          ErrorCodes.AUTH_UNAUTHORIZED
        );
      }

      // Validate invitation token against database
      const tokenData = await validateInvitationToken(invitationToken);
      
      // Attach invitation context to event
      (evt as any).invitationContext = {
        token: invitationToken,
        signerId: tokenData.signerId,
        envelopeId: tokenData.envelopeId,
        expiresAt: tokenData.expiresAt,
        permissions: tokenData.permissions
      };

      console.log('✅ [INVITATION DEBUG] Invitation token validated successfully');
    } catch (error) {
      console.error('❌ [INVITATION DEBUG] Invitation token validation failed:', error);
      throw error;
    }
  };
};

/**
 * Optional invitation token middleware
 * 
 * Similar to withInvitationToken but does not throw errors if token is missing.
 * Useful for endpoints that can work with or without invitation tokens.
 * 
 * @param tokenHeader - Header name containing the invitation token
 * @returns BeforeMiddleware that validates invitation token if present
 */
export const withOptionalInvitationToken = (tokenHeader = 'x-invitation-token'): BeforeMiddleware => {
  return async (evt) => {
    try {
      const invitationToken = evt.headers?.[tokenHeader] || 
                             evt.headers?.[tokenHeader.toUpperCase()] ||
                             evt.queryStringParameters?.invitationToken;

      if (!invitationToken) {
        // No token provided, continue without invitation context
        return;
      }

      // Validate token if present
      const tokenData = await validateInvitationToken(invitationToken);
      
      (evt as any).invitationContext = {
        token: invitationToken,
        signerId: tokenData.signerId,
        envelopeId: tokenData.envelopeId,
        expiresAt: tokenData.expiresAt,
        permissions: tokenData.permissions
      };

      console.log('✅ [INVITATION DEBUG] Optional invitation token validated successfully');
    } catch (error) {
      // For optional invitation, we ignore validation errors and continue without invitation context
      console.warn('Optional invitation token validation failed:', (error as Error).message);
    }
  };
};

/**
 * Validates invitation token against database
 * 
 * This function:
 * 1. Looks up token in InvitationTokenRepository
 * 2. Validates token expiration
 * 3. Returns token data or throws appropriate errors
 */
async function validateInvitationToken(token: string): Promise<{
  signerId: string;
  envelopeId: string;
  expiresAt: Date;
  permissions: string[];
}> {
  // Import repositories dynamically to avoid circular dependencies
  const { InvitationTokenRepository } = await import('../repositories/InvitationTokenRepository');
  const { loadConfig } = await import('../config');
  const { createDynamoDBClient } = await import('../utils/dynamodb-client');
  
  const config = loadConfig();
  const ddbClient = createDynamoDBClient(config.dynamodb);
  const invitationTokenRepository = new InvitationTokenRepository(
    config.ddb.invitationTokensTable,
    ddbClient
  );
  
  // Look up token in database
  const invitationToken = await invitationTokenRepository.getByToken(token);
  
  if (!invitationToken) {
    throw new UnauthorizedError(
      'Invalid invitation token',
      ErrorCodes.AUTH_UNAUTHORIZED
    );
  }
  
  // Check if token is expired
  if (invitationToken.getExpiresAt() < new Date()) {
    throw new UnauthorizedError(
      'Invitation token has expired',
      ErrorCodes.AUTH_UNAUTHORIZED
    );
  }
  
  // Return token data
  return {
    signerId: invitationToken.getSignerId().getValue(),
    envelopeId: invitationToken.getEnvelopeId().getValue(),
    expiresAt: invitationToken.getExpiresAt(),
    permissions: ['VIEW', 'SIGN', 'DECLINE'] // Basic permissions for invitation tokens
  };
}
