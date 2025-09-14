/**
 * @fileoverview Signer DynamoDB types - Types for signer DynamoDB operations
 * @summary Types for signer pattern implementation with DynamoDB
 * @description Defines DynamoDB item structures and key builders for signer pattern,
 * including single-table design with GSI for envelope, email, status, and token-based queries.
 */

import type { BaseCursorPayload } from '../common/dynamodb-query';
import type { DdbItemWithAudit } from '../common/dynamodb-base';
import { DynamoDbPrefixes } from '../../../enums/DynamoDbPrefixes';

/**
 * Signer DynamoDB item structure
 * Implements single-table pattern with GSI for envelope, email, status, and token-based queries
 */
export interface SignerDdbItem extends DdbItemWithAudit {
  // Primary key
  pk: string;                    // "SIGNER#<signerId>"
  sk: string;                    // "META#<signerId>"
  
  // Item metadata
  type: string;                  // "Signer"
  
  // Signer data
  signerId: string;              // Unique signer ID
  envelopeId: string;            // Envelope ID
  email: string;                 // Signer email
  fullName: string;              // Signer full name
  status: string;                // Signer status
  order: number;                 // Signing order
  
  // Optional timestamps
  signedAt?: string;             // ISO timestamp when signed
  declinedAt?: string;           // ISO timestamp when declined
  invitationToken?: string;      // Invitation token for external signers
  
  // Metadata
  ipAddress?: string;            // IP address
  userAgent?: string;            // User agent
  consentGiven: boolean;         // Whether consent was given
  consentTimestamp?: string;     // ISO timestamp when consent was given
  declineReason?: string;        // Reason for declining
  
  // GSI1: Envelope-based queries
  gsi1pk: string;               // "ENVELOPE#<envelopeId>"
  gsi1sk: string;               // "SIGNER#<signerId>"
  
  // GSI2: Email-based queries
  gsi2pk: string;               // "EMAIL#<email>"
  gsi2sk: string;               // "SIGNER#<signerId>"
  
  // GSI3: Status-based queries
  gsi3pk: string;               // "STATUS#<status>"
  gsi3sk: string;               // "SIGNER#<signerId>"
  
  // GSI4: Invitation token queries
  gsi4pk?: string;              // "TOKEN#<invitationToken>"
  gsi4sk?: string;              // "SIGNER#<signerId>"
}

/**
 * Signer list cursor payload for pagination
 * Extends base cursor with signer-specific fields
 */
export interface SignerListCursorPayload extends BaseCursorPayload {
  signerId: string;
  order: string; // Converted to string for BaseCursorPayload compatibility
}

/**
 * Signer list result interface
 */
export interface SignerListResult {
  items: SignerDdbItem[];
  nextCursor?: string;
  hasMore: boolean;
}

/**
 * Key builders for signer DynamoDB operations
 * Provides methods to build various DynamoDB keys for signer queries
 */
export class SignerKeyBuilders {
  /**
   * Builds primary key for signer
   * @param signerId - The signer ID
   * @returns Primary key object
   */
  static buildPrimaryKey(signerId: string): { pk: string; sk: string } {
    return {
      pk: `${DynamoDbPrefixes.SIGNER}${signerId}`,
      sk: `META#${signerId}`
    };
  }

  /**
   * Builds GSI1 key for envelope-based queries
   * @param envelopeId - The envelope ID
   * @param signerId - The signer ID
   * @returns GSI1 key object
   */
  static buildGsi1Key(envelopeId: string, signerId: string): { gsi1pk: string; gsi1sk: string } {
    return {
      gsi1pk: `${DynamoDbPrefixes.ENVELOPE}${envelopeId}`,
      gsi1sk: `${DynamoDbPrefixes.SIGNER}${signerId}`
    };
  }

  /**
   * Builds GSI2 key for email-based queries
   * @param email - The signer email
   * @param signerId - The signer ID
   * @returns GSI2 key object
   */
  static buildGsi2Key(email: string, signerId: string): { gsi2pk: string; gsi2sk: string } {
    return {
      gsi2pk: `EMAIL#${email}`,
      gsi2sk: `${DynamoDbPrefixes.SIGNER}${signerId}`
    };
  }

  /**
   * Builds GSI3 key for status-based queries
   * @param status - The signer status
   * @param signerId - The signer ID
   * @returns GSI3 key object
   */
  static buildGsi3Key(status: string, signerId: string): { gsi3pk: string; gsi3sk: string } {
    return {
      gsi3pk: `STATUS#${status}`,
      gsi3sk: `${DynamoDbPrefixes.SIGNER}${signerId}`
    };
  }

  /**
   * Builds GSI4 key for invitation token queries
   * @param invitationToken - The invitation token
   * @param signerId - The signer ID
   * @returns GSI4 key object
   */
  static buildGsi4Key(invitationToken: string, signerId: string): { gsi4pk: string; gsi4sk: string } {
    return {
      gsi4pk: `TOKEN#${invitationToken}`,
      gsi4sk: `${DynamoDbPrefixes.SIGNER}${signerId}`
    };
  }
}
