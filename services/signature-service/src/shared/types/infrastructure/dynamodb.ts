/**
 * @file dynamodb.ts
 * @summary DynamoDB-specific types and interfaces
 * @description Shared types for DynamoDB operations, queries, and data structures
 * used across different DynamoDB repositories and mappers.
 */

import type { DdbClientLike, TenantId, Mapper, UserId } from "@lawprotect/shared-ts";
import { BadRequestError, ErrorCodes } from "@lawprotect/shared-ts";
import { Envelope, Party } from "@/domain/entities";
import { PartyId, EnvelopeId } from "@/domain/value-objects";

/**
 * @summary Minimal shape of the `query` operation required (SDK-agnostic)
 * @description Defines the structure for DynamoDB query parameters.
 * Used by repositories to perform queries on DynamoDB tables and indexes.
 */
export interface DdbQueryParams {
  /** DynamoDB table name */
  readonly TableName: string;
  /** Global Secondary Index name (optional) */
  readonly IndexName?: string;
  /** Key condition expression for the query */
  readonly KeyConditionExpression: string;
  /** Expression attribute names (optional) */
  readonly ExpressionAttributeNames?: Record<string, string>;
  /** Expression attribute values (optional) */
  readonly ExpressionAttributeValues?: Record<string, unknown>;
  /** Maximum number of items to return (optional) */
  readonly Limit?: number;
  /** Whether to scan index forward (optional) */
  readonly ScanIndexForward?: boolean;
  /** Exclusive start key for pagination (optional) */
  readonly ExclusiveStartKey?: Record<string, unknown>;
}

/**
 * @summary Result structure for DynamoDB query operations
 * @description Contains the items returned by a DynamoDB query operation
 * and pagination information for subsequent queries.
 */
export interface DdbQueryResult {
  /** Array of items returned by the query */
  readonly Items?: Record<string, unknown>[];
  /** Last evaluated key for pagination */
  readonly LastEvaluatedKey?: Record<string, unknown>;
}

/**
 * @summary DynamoDB client with `query` support
 * @description Extends the base DdbClientLike interface to include
 * the query operation required for repository implementations.
 */
export interface DdbClientWithQuery extends DdbClientLike {
  /**
   * @summary Execute a DynamoDB query operation
   * @param params - Query parameters
   * @returns Promise resolving to query result
   */
  query(params: DdbQueryParams): Promise<DdbQueryResult>;
}

/**
 * @summary DynamoDB client with `update` support
 * @description Extends the base DdbClientLike interface to include
 * the update operation required for repository implementations.
 */
export interface DdbClientWithUpdate extends DdbClientLike {
  /**
   * @summary Execute a DynamoDB update operation
   * @param params - Update parameters
   * @returns Promise resolving to update result
   */
  update(params: any): Promise<any>;
}

/**
 * @summary Common DynamoDB item structure
 * @description Base interface for all DynamoDB items with required
 * partition key, sort key, and type fields.
 */
export interface DdbItem {
  /** Partition key */
  readonly pk: string;
  /** Sort key */
  readonly sk: string;
  /** Item type for single-table design */
  readonly type: string;
  /** Additional properties */
  readonly [key: string]: unknown;
}

/**
 * @summary DynamoDB item with TTL support
 * @description Extends DdbItem to include time-to-live functionality
 * for automatic item expiration.
 */
export interface DdbItemWithTTL extends DdbItem {
  /** Time-to-live timestamp */
  readonly ttl?: number;
}

/**
 * @summary DynamoDB item with versioning support
 * @description Extends DdbItem to include version control for
 * optimistic locking and conflict resolution.
 */
export interface DdbItemWithVersion extends DdbItem {
  /** Item version for optimistic locking */
  readonly version: number;
  /** Last update timestamp */
  readonly updatedAt: string;
}

/**
 * @summary DynamoDB item with audit fields
 * @description Extends DdbItem to include audit trail information
 * for tracking creation and modification.
 */
export interface DdbItemWithAudit extends DdbItem {
  /** Creation timestamp */
  readonly createdAt: string;
  /** Last update timestamp */
  readonly updatedAt: string;
  /** User who created the item */
  readonly createdBy?: string;
  /** User who last updated the item */
  readonly updatedBy?: string;
}

/**
 * @summary DynamoDB item with tenant isolation
 * @description Extends DdbItem to include tenant identifier
 * for multi-tenancy support.
 */
export interface DdbItemWithTenant extends DdbItem {
  /** Tenant identifier for multi-tenancy */
  readonly tenantId: string;
}

/**
 * @summary Complete DynamoDB item with all common fields
 * @description Combines all common DynamoDB item interfaces
 * for comprehensive item structure.
 */
export interface DdbItemComplete extends DdbItemWithTTL, DdbItemWithVersion, DdbItemWithAudit, DdbItemWithTenant {}

/**
 * @summary DynamoDB Party item structure
 * @description Specific DynamoDB item structure for Party entities
 * in the single-table design pattern.
 */
export interface DdbPartyItem extends DdbItemWithTenant, DdbItemWithAudit {
  /** Party identifier */
  readonly partyId: string;
  /** Associated envelope identifier */
  readonly envelopeId: string;
  /** Party name */
  readonly name: string;
  /** Party email address */
  readonly email: string;
  /** Party role in the envelope */
  readonly role: string;
  /** Current party status */
  readonly status: string;
  /** When the party was invited */
  readonly invitedAt: string;
  /** When the party signed (optional) */
  readonly signedAt?: string;
  /** Sequence number for signing order */
  readonly sequence: number;
  /** OTP state for authentication (optional) */
  readonly otpState?: {
    readonly required: boolean;
    readonly verified: boolean;
    readonly attempts: number;
    readonly lastAttempt?: string;
  };
}



/**
 * @summary DynamoDB Document item structure
 * @description Specific DynamoDB item structure for Document entities
 * in the single-table design pattern.
 */
export interface DdbDocumentItem extends DdbItemWithTenant, DdbItemWithAudit {
  /** Document identifier */
  readonly documentId: string;
  /** Associated envelope identifier */
  readonly envelopeId: string;
  /** Document name */
  readonly name: string;
  /** Document status */
  readonly status: string;
  /** Document file size in bytes */
  readonly size: number;
  /** Document content type */
  readonly contentType: string;
  /** S3 object reference */
  readonly s3Key: string;
  /** Document page count */
  readonly pageCount?: number;
  /** Document hash for integrity */
  readonly hash?: string;
}

/**
 * @summary DynamoDB Input item structure
 * @description Specific DynamoDB item structure for Input entities
 * in the single-table design pattern.
 */
export interface DdbInputItem extends DdbItemWithTenant, DdbItemWithAudit {
  /** Input identifier */
  readonly inputId: string;
  /** Associated envelope identifier */
  readonly envelopeId: string;
  /** Associated document identifier */
  readonly documentId: string;
  /** Input type */
  readonly type: string;
  /** Input page number */
  readonly page: number;
  /** Input position coordinates */
  readonly position: {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
  };
  /** Whether the input is required */
  readonly required: boolean;
  /** Input value (optional) */
  readonly value?: string;
  /** Associated party identifier */
  readonly partyId?: string;
}

/**
 * @summary Composite identifier for Party entities
 * @description Composite key used by Party repositories to identify
 * specific parties within an envelope context.
 */
export interface PartyKey {
  /** Associated envelope identifier */
  readonly envelopeId: string;
  /** Party identifier */
  readonly partyId: string;
}

/**
 * @summary Composite identifier for Input entities
 * @description Composite key used by Input repositories to identify
 * specific inputs within an envelope context.
 */
export interface InputKey {
  /** Associated envelope identifier */
  readonly envelopeId: string;
  /** Input identifier */
  readonly inputId: string;
}

/**
 * @summary Query parameters for listing inputs
 * @description Parameters used to query and filter input entities.
 */
export interface ListInputsQuery {
  /** Associated envelope identifier */
  readonly envelopeId: string;
  /** Associated document identifier */
  readonly documentId?: string;
  /** Associated party identifier */
  readonly partyId?: string;
  /** Input type filter */
  readonly type?: string;
  /** Page number for pagination */
  readonly page?: number;
  /** Maximum number of items to return */
  readonly limit?: number;
}

/**
 * @summary Result structure for listing inputs
 * @description Contains the list of inputs and pagination information.
 */
export interface ListInputsResult {
  /** Array of input entities */
  readonly items: unknown[];
  /** Total count of inputs */
  readonly total: number;
  /** Whether there are more items */
  readonly hasMore: boolean;
  /** Pagination cursor */
  readonly nextCursor?: string;
}

/**
 * @summary Type guard to check if a DynamoDB client supports query operations
 * @description Runtime check to verify if a DynamoDB client implements
 * the query operation required by repositories.
 * @param ddb - The DynamoDB client to check
 * @returns True if the client supports query operations
 */
export function hasQuerySupport(ddb: DdbClientLike): ddb is DdbClientWithQuery {
  return typeof (ddb as any)?.query === "function";
}

/**
 * @summary Type guard to check if a DynamoDB client supports update operations
 * @description Runtime check to verify if a DynamoDB client implements
 * the update operation required by repositories.
 * @param ddb - The DynamoDB client to check
 * @returns True if the client supports update operations
 */
export function hasUpdateSupport(ddb: DdbClientLike): ddb is DdbClientWithUpdate {
  return typeof (ddb as any)?.update === "function";
}

/**
 * @summary Asserts at runtime that the provided client implements `query`
 * @description Throws an error if the client doesn't support the query operation.
 * Used by repositories to ensure required functionality is available.
 * @param ddb - The DynamoDB client to check
 * @throws {Error} When the client doesn't implement query functionality
 */
export function requireQuery(ddb: DdbClientLike): asserts ddb is DdbClientWithQuery {
  if (!hasQuerySupport(ddb)) {
    throw new Error(
      "The provided DDB client does not implement `query(...)`. " +
      "Use a client compatible with DocumentClient.query or provide an adapter exposing it."
    );
  }
}

/**
 * @summary Asserts at runtime that the provided client implements `update`
 * @description Throws an error if the client doesn't support the update operation.
 * Used by repositories to ensure required functionality is available.
 * @param ddb - The DynamoDB client to check
 * @throws {Error} When the client doesn't implement update functionality
 */
export function requireUpdate(ddb: DdbClientLike): asserts ddb is DdbClientWithUpdate {
  if (!hasUpdateSupport(ddb)) {
    throw new Error(
      "The provided DDB client does not implement `update(...)`. " +
      "Use a client compatible with DocumentClient.update or provide an adapter exposing it."
    );
  }
}


/**
 * @summary Party ↔ DynamoDB item mapper
 * @description Maps between Party domain entities and DynamoDB items
 * PK = ENVELOPE#<envelopeId>
 * SK = PARTY#<partyId>
 */
export const PARTY_ENTITY = "Party" as const;

/** Key builders */
export const partyPk = (envelopeId: string): string => `ENVELOPE#${envelopeId}`;
export const partySk = (partyId: string): string => `PARTY#${partyId}`;

/** Type guard mínimo sobre campos requeridos en storage */
export const isDdbPartyItem = (v: unknown): v is DdbPartyItem => {
  const o = v as Partial<DdbPartyItem> | null | undefined;
  return Boolean(
    o &&
      typeof o.pk === "string" &&
      typeof o.sk === "string" &&
      o.type === PARTY_ENTITY &&
      typeof o.tenantId === "string" &&
      typeof o.envelopeId === "string" &&
      typeof o.partyId === "string" &&
      typeof o.name === "string" &&
      typeof o.email === "string" &&
      typeof o.role === "string" &&
      typeof o.status === "string" &&
      typeof o.invitedAt === "string" &&
      typeof o.sequence === "number" &&
      typeof o.createdAt === "string" &&
      typeof o.updatedAt === "string"
  );
};

/** Domain → Item (sin escribir `undefined`) */
export const toPartyItem = (src: Party): DdbPartyItem => ({
  pk: partyPk(src.envelopeId),
  sk: partySk(src.partyId),
  type: PARTY_ENTITY,

  tenantId: src.tenantId,
  envelopeId: src.envelopeId,
  partyId: src.partyId,

  name: src.name,
  email: src.email,
  role: src.role as string,
  status: src.status as string,

  invitedAt: src.invitedAt,
  ...(src.signedAt !== undefined ? { signedAt: src.signedAt } : {}),

  sequence: src.sequence,

  createdAt: src.createdAt,
  updatedAt: src.updatedAt,

  ...(src.otpState !== undefined ? { 
    otpState: {
      required: src.otpState.tries < src.otpState.maxTries,
      verified: false, // Default value
      attempts: src.otpState.tries,
      lastAttempt: src.otpState.createdAt
    }
  } : {}),
});

/** Item → Domain */
export const fromPartyItem = (item: unknown): Party => {
  if (!isDdbPartyItem(item)) {
    throw new BadRequestError(
      "Invalid persistence object for Party",
      ErrorCodes.COMMON_BAD_REQUEST,
      { item }
    );
  }



  return Object.freeze<Party>({
    tenantId: item.tenantId as TenantId,
    partyId: item.partyId as PartyId,
    envelopeId: item.envelopeId as EnvelopeId,
    name: item.name,
    email: item.email,
    role: item.role as any, // Cast to PartyRole
    status: item.status as any, // Cast to PartyStatus

    invitedAt: item.invitedAt,
    signedAt: item.signedAt,

    sequence: item.sequence,

    auth: { methods: ["otpViaEmail"] }, // Default auth

    createdAt: item.createdAt,
    updatedAt: item.updatedAt,

    otpState: item.otpState ? {
      codeHash: "dummy", // Default value
      channel: "email" as any, // Default value
      expiresAt: new Date().toISOString(), // Default value
      tries: item.otpState.attempts,
      maxTries: 3, // Default value
      createdAt: item.otpState.lastAttempt || new Date().toISOString()
    } : undefined,
  });
};

/** Mapper export */
export const partyItemMapper: Mapper<Party, DdbPartyItem> = {
  toDTO: toPartyItem,
  fromDTO: fromPartyItem,
};

// ============================================================================
// ENVELOPE ITEM MAPPER
// ============================================================================

/** @description DynamoDB entity label for Envelope rows */
export const ENVELOPE_ENTITY = "Envelope" as const;
/** @description Fixed sort key for Envelope meta row */
const ENVELOPE_META = "META" as const;

/**
 * @description DynamoDB persistence shape for an `Envelope` meta row.
 * Values are plain strings/arrays for storage compatibility.
 */
export interface DdbEnvelopeItem {
  /** DynamoDB partition key */
  pk: string;
  /** DynamoDB sort key */
  sk: string;
  /** Entity type identifier */
  type: typeof ENVELOPE_ENTITY;

  /** Envelope identifier (stored as plain string for DynamoDB) */
  envelopeId: string;
  /** Tenant identifier (stored as plain string for DynamoDB) */
  tenantId: string;
  /** Owner identifier (stored as plain string for DynamoDB) */
  ownerId: string;

  /** Envelope title */
  title: string;
  /** Envelope status */
  status: string;
  /** Creation timestamp (ISO-8601) */
  createdAt: string;
  /** Last update timestamp (ISO-8601) */
  updatedAt: string;

  /** Array of party identifiers (stored as plain strings for DynamoDB) */
  parties: string[];
  /** Array of document identifiers (stored as plain strings for DynamoDB) */
  documents: string[];

  /** Optional TTL & GSI keys (presence depends on your table/index design) */
  ttl?: number;
  /** GSI1 partition key */
  gsi1pk?: string;
  /** GSI1 sort key */
  gsi1sk?: string;
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Key builders                                                              */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * @description Builds the partition key for an envelope.
 *
 * @param {string} envelopeId - The envelope identifier
 * @returns {string} DynamoDB partition key
 */
export const envelopePk = (envelopeId: string): string => `ENVELOPE#${envelopeId}`;

/**
 * @description Returns the fixed meta sort key.
 *
 * @returns {string} Fixed meta sort key
 */
export const envelopeMetaSk = (): string => ENVELOPE_META;

/**
 * @description Example owner-based GSI partition key.
 *
 * @param {string} ownerId - The owner identifier
 * @returns {string} GSI partition key
 */
export const gsi1OwnerPk = (ownerId: string): string => `OWNER#${ownerId}`;

/**
 * @description Example owner-based GSI sort key (stable, time-sortable).
 *
 * @param {string} updatedAtIso - ISO timestamp for sorting
 * @returns {string} GSI sort key
 */
export const gsi1OwnerSk = (updatedAtIso: string): string => `ENVELOPE#${updatedAtIso}`;

/* ────────────────────────────────────────────────────────────────────────── */
/* Type guard                                                                */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * @description Runtime guard to ensure the raw item looks like an `DdbEnvelopeItem`.
 * Performs lightweight validation before mapping from DTO.
 *
 * @param {unknown} value - Arbitrary object to validate
 * @returns {boolean} `true` if the value has the minimal required envelope shape
 */
export function isDdbEnvelopeItem(value: unknown): value is DdbEnvelopeItem {
  const o = value as DdbEnvelopeItem;
  return (
    o !== null &&
    typeof o === "object" &&
    typeof o.pk === "string" &&
    typeof o.sk === "string" &&
    o.type === ENVELOPE_ENTITY &&
    typeof o.envelopeId === "string" &&
    typeof o.tenantId === "string" &&
    typeof o.ownerId === "string" &&
    typeof o.title === "string" &&
    typeof o.status === "string" &&
    typeof o.createdAt === "string" &&
    typeof o.updatedAt === "string" &&
    Array.isArray(o.parties) &&
    Array.isArray(o.documents)
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Mapper implementation                                                     */
/* ────────────────────────────────────────────────────────────────────────── */

/** Domain → Item */
export const toEnvelopeItem = (src: Envelope): DdbEnvelopeItem => {
  const envelopeIdStr = src.envelopeId as unknown as string;
  const tenantIdStr = src.tenantId as unknown as string;
  const ownerIdStr = (src.ownerId as UserId | string) as unknown as string;

  return {
    pk: envelopePk(envelopeIdStr),
    sk: envelopeMetaSk(),
    type: ENVELOPE_ENTITY,

    envelopeId: envelopeIdStr,
    tenantId: tenantIdStr,
    ownerId: ownerIdStr,

    title: src.title,
    status: src.status as string,
    createdAt: src.createdAt,
    updatedAt: src.updatedAt,

    parties: [...(src.parties ?? [])],
    documents: [...(src.documents ?? [])],

    // Example owner-based GSI (optional; include only if your table defines it)
    gsi1pk: gsi1OwnerPk(ownerIdStr),
    gsi1sk: gsi1OwnerSk(src.updatedAt),
  };
};

/** Item → Domain */
export const fromEnvelopeItem = (item: unknown): Envelope => {
  if (!isDdbEnvelopeItem(item)) {
    throw new BadRequestError(
      "Invalid persistence object for Envelope",
      ErrorCodes.COMMON_BAD_REQUEST,
      { item }
    );
  }

  return Object.freeze<Envelope>({
    envelopeId: item.envelopeId as EnvelopeId,
    tenantId: item.tenantId as TenantId,
    ownerId: item.ownerId as UserId,

    title: item.title,
    status: item.status as any, // Cast to EnvelopeStatus
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    parties: [...item.parties],
    documents: [...item.documents],
  });
};

/** Mapper export */
export const envelopeItemMapper: Mapper<Envelope, DdbEnvelopeItem> = {
  toDTO: toEnvelopeItem,
  fromDTO: fromEnvelopeItem,
};