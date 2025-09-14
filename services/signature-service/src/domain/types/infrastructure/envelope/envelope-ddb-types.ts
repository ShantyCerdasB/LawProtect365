/**
 * @fileoverview Envelope DynamoDB types - Specific types for envelope DynamoDB operations
 * @summary Type definitions specific to envelope DynamoDB operations
 * @description Defines envelope-specific DynamoDB item structures, query parameters,
 * and result types that extend the common base types.
 */

import type { EnvelopeStatus } from '../../../enums/EnvelopeStatus';
import type { EnvelopeMetadata } from '../../envelope/EnvelopeMetadata';
import type { DdbItemWithAudit, DdbItemWithTTL } from '../common/dynamodb-base';
import type { BaseListParams, BaseListResult, BaseCountResult, BaseCursorPayload } from '../common/dynamodb-query';
import { DynamoDbPrefixes } from '../../../enums/DynamoDbPrefixes';

/**
 * DynamoDB item structure for envelope
 * Specific structure for envelope entities in DynamoDB single-table design.
 */
export interface EnvelopeDdbItem extends DdbItemWithAudit, DdbItemWithTTL {
  /** Entity type identifier */
  readonly type: 'ENVELOPE';
  /** Envelope identifier */
  readonly envelopeId: string;
  /** Document identifier from Document Service */
  readonly documentId: string;
  /** Owner identifier */
  readonly ownerId: string;
  /** Current envelope status */
  readonly status: EnvelopeStatus;
  /** Signing order configuration */
  readonly signingOrder: {
    readonly type: 'OWNER_FIRST' | 'INVITEES_FIRST';
  };
  /** Completion timestamp (optional) */
  readonly completedAt?: string;
  /** Envelope metadata */
  readonly metadata: EnvelopeMetadata;
  /** Array of signers */
  readonly signers: Array<{
    readonly id: string;
    readonly email: string;
    readonly fullName: string;
    readonly status: string;
    readonly order: number;
    readonly signedAt?: string;
    readonly declinedAt?: string;
    readonly invitationToken?: string;
    readonly metadata: {
      readonly ipAddress?: string;
      readonly userAgent?: string;
      readonly consentGiven: boolean;
      readonly consentTimestamp?: string;
      readonly declineReason?: string;
    };
  }>;
  /** GSI1 partition key for global queries */
  readonly gsi1pk: string;
  /** GSI1 sort key for date sorting */
  readonly gsi1sk: string;
  /** GSI2 partition key for owner queries */
  readonly gsi2pk: string;
  /** GSI2 sort key for status and date sorting */
  readonly gsi2sk: string;
}

/**
 * Cursor payload for envelope list pagination
 * Specific cursor structure for envelope pagination.
 */
export interface EnvelopeListCursorPayload extends BaseCursorPayload {
  /** Envelope identifier */
  readonly envelopeId: string;
  /** Index signature for JSON compatibility */
  readonly [key: string]: string;
}

/**
 * Query parameters for listing envelopes
 * Specific parameters for envelope listing operations.
 */
export interface EnvelopeListParams extends BaseListParams {
  /** Filter by owner identifier */
  readonly ownerId?: string;
  /** Filter by envelope status */
  readonly status?: EnvelopeStatus;
  /** Filter by start date */
  readonly startDate?: Date;
  /** Filter by end date */
  readonly endDate?: Date;
}

/**
 * Query result for envelope listing
 * Specific result structure for envelope listing operations.
 */
export interface EnvelopeListResult extends BaseListResult<any> {
  /** Array of envelope entities */
  readonly items: any[];
}

/**
 * Count result for envelope queries
 * Specific result structure for envelope counting operations.
 */
export interface EnvelopeCountResult extends BaseCountResult {
  /** Status filter used (if any) */
  readonly status?: EnvelopeStatus;
  /** Owner filter used (if any) */
  readonly ownerId?: string;
}

/**
 * Key builders for envelope DynamoDB operations
 * Utility functions for building DynamoDB keys for envelope operations.
 */
export class EnvelopeKeyBuilders {
  /**
   * Generates partition key for envelope
   * @param envelopeId - The envelope identifier
   * @returns Partition key string
   */
  static buildPk(envelopeId: string): string {
    return `${DynamoDbPrefixes.ENVELOPE}${envelopeId}`;
  }

  /**
   * Generates sort key for envelope metadata
   * @returns Sort key string
   */
  static buildMetaSk(): string {
    return DynamoDbPrefixes.META;
  }

  /**
   * Generates GSI1 partition key for envelope queries
   * @returns GSI1 partition key string
   */
  static buildGsi1Pk(): string {
    return DynamoDbPrefixes.ENVELOPE;
  }

  /**
   * Generates GSI1 sort key for envelope queries
   * @param createdAt - Creation timestamp
   * @param envelopeId - The envelope identifier
   * @returns GSI1 sort key string
   */
  static buildGsi1Sk(createdAt: string, envelopeId: string): string {
    return `${createdAt}#${envelopeId}`;
  }

  /**
   * Generates GSI2 partition key for owner queries
   * @param ownerId - The owner identifier
   * @returns GSI2 partition key string
   */
  static buildGsi2Pk(ownerId: string): string {
    return `${DynamoDbPrefixes.OWNER}${ownerId}`;
  }

  /**
   * Generates GSI2 sort key for owner queries
   * @param status - Envelope status
   * @param createdAt - Creation timestamp
   * @param envelopeId - The envelope identifier
   * @returns GSI2 sort key string
   */
  static buildGsi2Sk(status: EnvelopeStatus, createdAt: string, envelopeId: string): string {
    return `${status}#${createdAt}#${envelopeId}`;
  }

  /**
   * Generates GSI2 partition key for status queries
   * @param status - The envelope status
   * @returns GSI2 partition key string
   */
  static buildStatusGsi2Pk(status: EnvelopeStatus): string {
    return `${DynamoDbPrefixes.STATUS}${status}`;
  }
}
