/**
 * @file common.ts
 * @summary Common domain types and interfaces
 * @description Shared domain types that are used across different domain entities and value objects
 */

import type { EnvelopeId, PartyId, DocumentId, InputId, SignatureId, TenantId, UserId } from "@/domain/value-objects/Ids";

/**
 * @description Base entity interface with common fields
 */
export interface BaseEntity {
  /** Unique identifier */
  id: string;
  /** Tenant identifier for multi-tenancy */
  tenantId: TenantId;
  /** Creation timestamp */
  createdAt: string;
  /** Last update timestamp */
  updatedAt: string;
}

/**
 * @description Entity with soft delete support
 */
export interface SoftDeletableEntity extends BaseEntity {
  /** Soft delete timestamp */
  deletedAt?: string;
  /** Whether the entity is deleted */
  isDeleted: boolean;
}

/**
 * @description Entity with versioning support
 */
export interface VersionedEntity extends BaseEntity {
  /** Entity version for optimistic locking */
  version: number;
}

/**
 * @description Entity with audit trail support
 */
export interface AuditableEntity extends BaseEntity {
  /** User who created the entity */
  createdBy?: UserId;
  /** User who last updated the entity */
  updatedBy?: UserId;
}

/**
 * @description Complete entity with all common features
 */
export interface CompleteEntity extends SoftDeletableEntity, VersionedEntity, AuditableEntity {}

/**
 * @description Base aggregate root interface
 */
export interface AggregateRoot extends CompleteEntity {
  /** Domain events that occurred on this aggregate */
  domainEvents: DomainEvent[];
}

/**
 * @description Domain event interface
 */
export interface DomainEvent {
  /** Unique event identifier */
  id: string;
  /** Event type */
  type: string;
  /** When the event occurred */
  occurredAt: string;
  /** Event payload */
  payload: Record<string, unknown>;
  /** Event metadata */
  metadata?: Record<string, unknown>;
}

/**
 * @description Entity identifier type union
 */
export type EntityId = EnvelopeId | PartyId | DocumentId | InputId | SignatureId;

/**
 * @description Entity type mapping
 */
export interface EntityTypeMap {
  envelope: EnvelopeId;
  party: PartyId;
  document: DocumentId;
  input: InputId;
  signature: SignatureId;
}

/**
 * @description Entity type names
 */
export type EntityType = keyof EntityTypeMap;

/**
 * @description Pagination parameters
 */
export interface PaginationParams {
  /** Page size */
  limit?: number;
  /** Pagination cursor */
  cursor?: string;
  /** Sort direction */
  sortDirection?: 'asc' | 'desc';
}

/**
 * @description Pagination result
 */
export interface PaginationResult<T> {
  /** Items in current page */
  items: T[];
  /** Next page cursor */
  nextCursor?: string;
  /** Previous page cursor */
  prevCursor?: string;
  /** Total count (if available) */
  totalCount?: number;
  /** Whether there are more items */
  hasMore: boolean;
}

/**
 * @description Filter criteria
 */
export interface FilterCriteria {
  /** Field to filter by */
  field: string;
  /** Filter operator */
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'startsWith' | 'endsWith' | 'in' | 'notIn';
  /** Filter value */
  value: unknown;
}

/**
 * @description Sort criteria
 */
export interface SortCriteria {
  /** Field to sort by */
  field: string;
  /** Sort direction */
  direction: 'asc' | 'desc';
}

/**
 * @description Query parameters
 */
export interface QueryParams extends PaginationParams {
  /** Filter criteria */
  filters?: FilterCriteria[];
  /** Sort criteria */
  sort?: SortCriteria[];
  /** Search term */
  search?: string;
}

/**
 * @description Result wrapper for operations that may fail
 */
export interface Result<T, E = Error> {
  /** Whether the operation was successful */
  success: boolean;
  /** Success data (if successful) */
  data?: T;
  /** Error (if failed) */
  error?: E;
}

/**
 * @description Success result helper
 */
export function success<T>(data: T): Result<T> {
  return { success: true, data };
}

/**
 * @description Error result helper
 */
export function failure<T, E = Error>(error: E): Result<T, E> {
  return { success: false, error };
}
