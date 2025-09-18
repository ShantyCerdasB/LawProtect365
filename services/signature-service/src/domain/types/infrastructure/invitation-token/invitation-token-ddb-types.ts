/**
 * @fileoverview InvitationToken DynamoDB types - Database item structures and key builders
 * @summary DynamoDB types for invitation token data access
 * @description Defines the DynamoDB item structures, key builders, and cursor types
 * for invitation token repository operations.
 */

import type { BaseCursorPayload } from '../common/dynamodb-query';
import { DynamoDbPrefixes } from '../../../enums/DynamoDbPrefixes';

/**
 * DynamoDB item structure for invitation tokens
 */
export interface InvitationTokenDdbItem {
  readonly pk: string; // INVITATION_TOKEN#{token}
  readonly sk: string; // INVITATION_TOKEN#{token}
  readonly type: string; // INVITATION_TOKEN (required by DdbItem)
  readonly gsi1pk: string; // SIGNER#{signerId}
  readonly gsi1sk: string; // INVITATION_TOKEN#{token}
  readonly gsi2pk: string; // ENVELOPE#{envelopeId}
  readonly gsi2sk: string; // INVITATION_TOKEN#{token}
  readonly gsi3pk: string; // INVITATION_TOKEN
  readonly gsi3sk: string; // EXPIRES_AT#{expiresAt}#{token}
  readonly entityType: string; // INVITATION_TOKEN
  readonly token: string;
  readonly signerId: string;
  readonly envelopeId: string;
  readonly expiresAt: string; // ISO string
  readonly createdAt: string; // ISO string
  readonly usedAt?: string; // ISO string
  readonly metadata: {
    readonly ipAddress?: string;
    readonly userAgent?: string;
    readonly email?: string;
    readonly fullName?: string;
  };
  readonly ttl?: number; // Unix timestamp for automatic cleanup
  readonly [key: string]: any; // Index signature for DdbItem compatibility
}

/**
 * Key builders for invitation token operations
 */
export class InvitationTokenKeyBuilders {
  /**
   * Builds primary key for invitation token
   */
  static buildPk(token: string): string {
    return `${DynamoDbPrefixes.INVITATION_TOKEN}${token}`;
  }

  /**
   * Builds sort key for invitation token
   */
  static buildSk(token: string): string {
    return `${DynamoDbPrefixes.INVITATION_TOKEN}${token}`;
  }

  /**
   * Builds GSI1 primary key for signer queries
   */
  static buildGsi1Pk(signerId: string): string {
    return `${DynamoDbPrefixes.SIGNER}#${signerId}`;
  }

  /**
   * Builds GSI1 sort key for signer queries
   */
  static buildGsi1Sk(token: string): string {
    return `${DynamoDbPrefixes.INVITATION_TOKEN}${token}`;
  }

  /**
   * Builds GSI2 primary key for envelope queries
   */
  static buildGsi2Pk(envelopeId: string): string {
    return `${DynamoDbPrefixes.ENVELOPE}${envelopeId}`;
  }

  /**
   * Builds GSI2 sort key for envelope queries
   */
  static buildGsi2Sk(token: string): string {
    return `${DynamoDbPrefixes.INVITATION_TOKEN}${token}`;
  }

  /**
   * Builds GSI3 primary key for expiration queries
   */
  static buildGsi3Pk(): string {
    return DynamoDbPrefixes.INVITATION_TOKEN;
  }

  /**
   * Builds GSI3 sort key for expiration queries
   */
  static buildGsi3Sk(expiresAt: string, token: string): string {
    return `EXPIRES_AT#${expiresAt}#${token}`;
  }
}

/**
 * Cursor payload for invitation token list pagination
 */
export interface InvitationTokenListCursorPayload extends BaseCursorPayload {
  token: string;
  expiresAt: string;
}

/**
 * Query parameters for invitation token operations
 */
export interface InvitationTokenQueryParams {
  readonly limit?: number;
  readonly cursor?: string;
  readonly sortOrder?: 'asc' | 'desc';
}
