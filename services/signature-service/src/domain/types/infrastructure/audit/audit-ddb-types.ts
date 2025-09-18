/**
 * @fileoverview Audit DynamoDB types - Defines DynamoDB item structures and key builders for audit events
 * @summary Type definitions for audit event DynamoDB persistence layer
 * @description The audit DynamoDB types define the structure for storing audit events in DynamoDB
 * using single-table pattern with multiple GSI for efficient querying.
 */

import { DdbItemWithAudit, DdbItemWithTTL } from '../common/dynamodb-base';
import { BaseCursorPayload } from '../common/dynamodb-query';
import { AuditEventType } from '../../../enums/AuditEventType';
import { DynamoDbPrefixes } from '../../../enums/DynamoDbPrefixes';

/**
 * DynamoDB item structure for audit events
 * 
 * Uses single-table pattern with multiple GSI for efficient querying by:
 * - Envelope ID (GSI1)
 * - Signer ID (GSI2) 
 * - User ID (GSI3)
 * - Event Type (GSI4)
 */
export interface AuditDdbItem extends DdbItemWithAudit, DdbItemWithTTL {
  readonly auditEventId: string;
  readonly eventType: AuditEventType;
  readonly envelopeId: string;
  readonly signerId?: string;
  readonly signatureId?: string;
  readonly userId?: string;
  readonly userEmail?: string;
  readonly timestamp: string; // ISO string
  readonly ipAddress?: string;
  readonly userAgent?: string;
  readonly country?: string;
  readonly metadata?: Record<string, any>;
  readonly description: string;
}

/**
 * Cursor payload for audit event pagination
 */
export interface AuditListCursorPayload extends BaseCursorPayload {
  readonly auditEventId: string;
  readonly timestamp: string;
  readonly [key: string]: string;
}

/**
 * Key builders for audit event DynamoDB operations
 * 
 * Provides methods to build partition keys, sort keys, and GSI keys
 * for audit event storage and querying.
 */
export class AuditKeyBuilders {
  /**
   * Builds primary partition key for audit event
   * @param auditEventId - The audit event ID
   * @returns Partition key string
   */
  static buildPk(auditEventId: string): string {
    return `${DynamoDbPrefixes.AUDIT}${auditEventId}`;
  }

  /**
   * Builds primary sort key for audit event
   * @returns Sort key string
   */
  static buildMetaSk(): string {
    return DynamoDbPrefixes.META;
  }

  /**
   * Builds GSI1 partition key for envelope queries
   * @param envelopeId - The envelope ID
   * @returns GSI1 partition key string
   */
  static buildEnvelopeGsi1Pk(envelopeId: string): string {
    return `${DynamoDbPrefixes.ENVELOPE}${envelopeId}`;
  }

  /**
   * Builds GSI1 sort key for envelope queries (timestamp-based)
   * @param timestamp - The event timestamp
   * @returns GSI1 sort key string
   */
  static buildEnvelopeGsi1Sk(timestamp: string): string {
    return timestamp;
  }

  /**
   * Builds GSI2 partition key for signer queries
   * @param signerId - The signer ID
   * @returns GSI2 partition key string
   */
  static buildSignerGsi2Pk(signerId: string): string {
    return `${DynamoDbPrefixes.SIGNER}${signerId}`;
  }

  /**
   * Builds GSI2 sort key for signer queries (timestamp-based)
   * @param timestamp - The event timestamp
   * @returns GSI2 sort key string
   */
  static buildSignerGsi2Sk(timestamp: string): string {
    return timestamp;
  }

  /**
   * Builds GSI3 partition key for user queries
   * @param userId - The user ID
   * @returns GSI3 partition key string
   */
  static buildUserGsi3Pk(userId: string): string {
    return `${DynamoDbPrefixes.USER}${userId}`;
  }

  /**
   * Builds GSI3 sort key for user queries (timestamp-based)
   * @param timestamp - The event timestamp
   * @returns GSI3 sort key string
   */
  static buildUserGsi3Sk(timestamp: string): string {
    return timestamp;
  }

  /**
   * Builds GSI4 partition key for event type queries
   * @param eventType - The audit event type
   * @returns GSI4 partition key string
   */
  static buildTypeGsi4Pk(eventType: AuditEventType): string {
    return `${DynamoDbPrefixes.TYPE}${eventType}`;
  }

  /**
   * Builds GSI4 sort key for event type queries (timestamp-based)
   * @param timestamp - The event timestamp
   * @returns GSI4 sort key string
   */
  static buildTypeGsi4Sk(timestamp: string): string {
    return timestamp;
  }
}
