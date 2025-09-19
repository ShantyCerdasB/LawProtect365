/**
 * @fileoverview Audit mappers - Bidirectional mappers between AuditEvent domain objects and DynamoDB items
 * @summary Mappers for converting between audit event domain objects and DynamoDB persistence layer
 * @description The audit mappers provide type-safe conversion between AuditEvent domain objects
 * and DynamoDB items, handling all field mappings and type conversions.
 */

import { AuditEvent } from '../../../types/audit/AuditEvent';
import { CreateAuditEventRequest } from '../../../types/audit/CreateAuditEventRequest';
import type { AuditDdbItem } from './audit-ddb-types';
import { AuditKeyBuilders } from './audit-ddb-types';
import { AuditEventType } from '../../../enums/AuditEventType';
import { uuid } from '@lawprotect/shared-ts';

/**
 * Mapper for converting between AuditEvent domain objects and DynamoDB items
 */
export const auditItemMapper = {
  /**
   * Converts AuditEvent domain object to DynamoDB item
   * @param auditEvent - The audit event domain object
   * @returns DynamoDB item ready for storage
   */
  toDTO(auditEvent: AuditEvent): AuditDdbItem {
    const timestamp = auditEvent.timestamp.toISOString();
    
    return {
      // Primary keys
      pk: AuditKeyBuilders.buildPk(auditEvent.id),
      sk: AuditKeyBuilders.buildMetaSk(),
      type: 'AUDIT',
      
      // Audit event data
      auditEventId: auditEvent.id,
      eventType: auditEvent.type,
      envelopeId: auditEvent.envelopeId,
      signerId: auditEvent.signerId,
      signatureId: auditEvent.signatureId,
      userId: auditEvent.userId,
      userEmail: auditEvent.userEmail,
      timestamp,
      ipAddress: auditEvent.ipAddress,
      userAgent: auditEvent.userAgent,
      country: (auditEvent as any).country,
      metadata: auditEvent.metadata,
      description: auditEvent.description,
      
      // GSI keys
      gsi1pk: AuditKeyBuilders.buildEnvelopeGsi1Pk(auditEvent.envelopeId),
      gsi1sk: AuditKeyBuilders.buildEnvelopeGsi1Sk(timestamp),
      gsi2pk: auditEvent.signerId ? AuditKeyBuilders.buildSignerGsi2Pk(auditEvent.signerId) : undefined,
      gsi2sk: auditEvent.signerId ? AuditKeyBuilders.buildSignerGsi2Sk(timestamp) : undefined,
      gsi3pk: auditEvent.userId ? AuditKeyBuilders.buildUserGsi3Pk(auditEvent.userId) : undefined,
      gsi3sk: auditEvent.userId ? AuditKeyBuilders.buildUserGsi3Sk(timestamp) : undefined,
      gsi4pk: AuditKeyBuilders.buildTypeGsi4Pk(auditEvent.type),
      gsi4sk: AuditKeyBuilders.buildTypeGsi4Sk(timestamp),
      
      // Audit fields
      createdAt: auditEvent.timestamp.toISOString(),
      updatedAt: auditEvent.timestamp.toISOString(),
      createdBy: auditEvent.userId || 'system',
      updatedBy: auditEvent.userId || 'system',
      
      // TTL (optional - can be set based on retention policy)
      ttl: undefined
    };
  },

  /**
   * Converts DynamoDB item to AuditEvent domain object
   * @param item - The DynamoDB item
   * @returns Audit event domain object
   */
  fromDTO(item: AuditDdbItem): AuditEvent {
    return {
      id: item.auditEventId,
      type: item.eventType,
      envelopeId: item.envelopeId,
      signerId: item.signerId,
      signatureId: item.signatureId,
      userId: item.userId,
      userEmail: item.userEmail,
      timestamp: new Date(item.timestamp),
      ipAddress: item.ipAddress,
      userAgent: item.userAgent,
      country: (item as any).country,
      metadata: item.metadata,
      description: item.description
    };
  }
};

/**
 * Creates an AuditEvent from CreateAuditEventRequest
 * @param request - The create audit event request
 * @returns Audit event domain object with generated ID
 */
export function createAuditEventFromRequest(request: CreateAuditEventRequest): AuditEvent {
  return {
    id: uuid(),
    type: request.type,
    envelopeId: request.envelopeId,
    signerId: request.signerId,
    signatureId: request.signatureId,
    userId: request.userId,
    userEmail: request.userEmail,
    timestamp: new Date(),
    ipAddress: request.ipAddress,
    userAgent: request.userAgent,
    country: (request as any).country,
    metadata: request.metadata,
    description: request.description
  };
}

/**
 * Type guard to check if an object is a valid AuditDdbItem
 * @param value - The value to check
 * @returns True if the value is a valid AuditDdbItem
 */
export function isAuditDdbItem(value: unknown): value is AuditDdbItem {
  const item = value as AuditDdbItem;
  
  return (
    !!item &&
    typeof item === 'object' &&
    typeof item.pk === 'string' &&
    typeof item.sk === 'string' &&
    typeof item.type === 'string' &&
    typeof item.auditEventId === 'string' &&
    typeof item.envelopeId === 'string' &&
    typeof item.timestamp === 'string' &&
    typeof item.description === 'string' &&
    Object.values(AuditEventType).includes(item.eventType)
  );
}
