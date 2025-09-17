/**
 * @fileoverview DynamoDbPrefixes enum - Defines DynamoDB key prefixes
 * @summary Enumerates the prefixes used for DynamoDB keys in single-table design
 * @description The DynamoDbPrefixes enum defines all the prefixes used for building
 * DynamoDB partition keys, sort keys, and GSI keys in the single-table design pattern.
 */

/**
 * DynamoDB key prefixes enumeration
 * 
 * Defines all prefixes used for building DynamoDB keys in single-table design.
 * These prefixes help organize different entity types and query patterns.
 */
export enum DynamoDbPrefixes {
  /**
   * Envelope entity prefix
   * Used for envelope partition keys and GSI keys
   */
  ENVELOPE = 'ENVELOPE#',

  /**
   * Meta data prefix
   * Used for envelope metadata sort keys
   */
  META = 'META',

  /**
   * Owner prefix
   * Used for owner-based GSI partition keys
   */
  OWNER = 'OWNER#',

  /**
   * Status prefix
   * Used for status-based GSI partition keys
   */
  STATUS = 'STATUS#',

  /**
   * Signer entity prefix
   * Used for signer partition keys
   */
  SIGNER = 'SIGNER#',

  /**
   * Signature entity prefix
   * Used for signature partition keys
   */
  SIGNATURE = 'SIGNATURE#',

  /**
   * Token prefix
   * Used for invitation token keys
   */
  TOKEN = 'TOKEN#',

  /**
   * Invitation token prefix
   * Used for invitation token entity keys
   */
  INVITATION_TOKEN = 'INVITATION_TOKEN#',

  /**
   * Audit prefix
   * Used for audit event keys
   */
  AUDIT = 'AUDIT#',

  /**
   * User prefix
   * Used for user-based GSI partition keys
   */
  USER = 'USER#',

  /**
   * Type prefix
   * Used for event type-based GSI partition keys
   */
  TYPE = 'TYPE#',

  /**
   * Outbox prefix
   * Used for outbox pattern partition keys
   */
  OUTBOX = 'OUTBOX',

  /**
   * Consent prefix
   * Used for consent pattern partition keys
   */
  CONSENT = 'CONSENT#'
}

/**
 * Gets the partition key prefix for an entity type
 * @param entityType - The entity type
 * @returns The partition key prefix
 */
export function getEntityPrefix(entityType: string): string {
  const prefix = entityType.toUpperCase() as keyof typeof DynamoDbPrefixes;
  return DynamoDbPrefixes[prefix] || `${entityType.toUpperCase()}#`;
}

/**
 * Gets the GSI partition key prefix for owner queries
 * @param ownerId - The owner identifier
 * @returns The owner GSI partition key
 */
export function getOwnerGsiPrefix(ownerId: string): string {
  return `${DynamoDbPrefixes.OWNER}${ownerId}`;
}

/**
 * Gets the GSI partition key prefix for status queries
 * @param status - The status value
 * @returns The status GSI partition key
 */
export function getStatusGsiPrefix(status: string): string {
  return `${DynamoDbPrefixes.STATUS}${status}`;
}
