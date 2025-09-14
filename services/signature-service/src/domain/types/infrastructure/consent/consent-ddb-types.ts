/**
 * @fileoverview Consent DynamoDB types - Types for consent DynamoDB operations
 * @summary Types for consent pattern implementation with DynamoDB
 * @description Defines DynamoDB item structures and key builders for consent pattern,
 * including single-table design with GSI for envelope and signer-based queries.
 */

import type { BaseCursorPayload } from '../common/dynamodb-query';
import { DynamoDbPrefixes } from '../../../enums/DynamoDbPrefixes';

/**
 * Consent DynamoDB item structure
 * Implements single-table pattern with GSI for envelope and signer-based queries
 */
export interface ConsentDdbItem {
  // Primary key
  pk: string;                    // "CONSENT#<consentId>"
  sk: string;                    // "META#<consentId>"
  
  // Item metadata
  type: string;                  // "Consent"
  
  // Consent data
  consentId: string;             // Unique consent ID
  envelopeId: string;            // Envelope ID
  signerId: string;              // Signer ID
  signatureId: string;           // Signature ID (linked)
  
  // Consent details
  consentGiven: boolean;         // Whether consent was given
  consentTimestamp: string;      // ISO timestamp
  consentText: string;           // Consent text shown to signer
  
  // Compliance metadata
  ipAddress: string;             // IP address
  userAgent: string;             // User agent
  
  // GSI1: Envelope-based queries
  gsi1pk: string;               // "ENVELOPE#<envelopeId>"
  gsi1sk: string;               // "CONSENT#<consentId>"
  
  // GSI2: Signer-based queries
  gsi2pk: string;               // "SIGNER#<signerId>"
  gsi2sk: string;               // "CONSENT#<consentId>"
  
  // Audit fields
  createdAt: string;            // ISO timestamp
  updatedAt: string;            // ISO timestamp
}

/**
 * Consent list cursor payload for pagination
 * Extends base cursor with consent-specific fields
 */
export interface ConsentListCursorPayload extends BaseCursorPayload {
  envelopeId: string;            // Filter by envelope
  signerId: string;              // Filter by signer
  [key: string]: string;
}

/**
 * Consent key builders utility class
 * Provides methods to build DynamoDB keys for consent operations
 */
export class ConsentKeyBuilders {
  /**
   * Builds primary key for consent record
   * @param consentId - Consent ID
   * @returns Primary key object
   */
  static buildPrimaryKey(consentId: string): { pk: string; sk: string } {
    return {
      pk: `${DynamoDbPrefixes.CONSENT}${consentId}`,
      sk: `META#${consentId}`
    };
  }

  /**
   * Builds GSI1 key for envelope-based queries
   * @param envelopeId - Envelope ID
   * @param consentId - Consent ID
   * @returns GSI1 key object
   */
  static buildEnvelopeGsi1Key(envelopeId: string, consentId: string): { gsi1pk: string; gsi1sk: string } {
    return {
      gsi1pk: `${DynamoDbPrefixes.ENVELOPE}${envelopeId}`,
      gsi1sk: `${DynamoDbPrefixes.CONSENT}${consentId}`
    };
  }

  /**
   * Builds GSI2 key for signer-based queries
   * @param signerId - Signer ID
   * @param consentId - Consent ID
   * @returns GSI2 key object
   */
  static buildSignerGsi2Key(signerId: string, consentId: string): { gsi2pk: string; gsi2sk: string } {
    return {
      gsi2pk: `${DynamoDbPrefixes.SIGNER}${signerId}`,
      gsi2sk: `${DynamoDbPrefixes.CONSENT}${consentId}`
    };
  }
}

/**
 * Consent query options
 * Configuration for consent queries
 */
export interface ConsentQueryOptions {
  envelopeId?: string;
  signerId?: string;
  limit?: number;
  cursor?: string;
  scanIndexForward?: boolean;
}
