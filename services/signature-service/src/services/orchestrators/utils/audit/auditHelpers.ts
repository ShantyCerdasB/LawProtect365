/**
 * @fileoverview auditHelpers - Generic audit event creation utilities
 * @summary Base utilities for creating audit events with common patterns
 * @description This module provides generic functions for creating audit events
 * with consistent patterns and common fields across the application.
 */

import { AuditEventType } from '@/domain/enums/AuditEventType';
import { createNetworkSecurityContext, Email } from '@lawprotect/shared-ts';

/**
 * Base audit event data structure
 */
export interface AuditEventData {
  envelopeId: string;
  signerId?: string;
  eventType: AuditEventType;
  description: string;
  userId: string;
  userEmail?: string;
  networkContext: ReturnType<typeof createNetworkSecurityContext>;
  metadata: Record<string, any>;
}

/**
 * Creates a generic audit event with common fields
 * @param envelopeId - The envelope ID
 * @param eventType - The type of audit event
 * @param description - Human-readable description
 * @param userId - The user performing the action
 * @param signerId - Optional signer ID
 * @param metadata - Additional metadata
 * @returns Audit event data
 */
export function createAuditEvent(
  envelopeId: string,
  eventType: AuditEventType,
  description: string,
  userId: string,
  signerId?: string,
  userEmail?: Email,
  metadata?: Record<string, any>
): AuditEventData {
  return {
    envelopeId,
    signerId,
    eventType,
    description,
    userId,
    userEmail: userEmail ? userEmail.getValue() : undefined,
    networkContext: createNetworkSecurityContext(),
    metadata: {
      envelopeId,
      ...metadata
    }
  };
}
