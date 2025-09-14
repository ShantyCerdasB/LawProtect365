/**
 * @fileoverview SortBy enum - Defines available sorting fields for different entities
 * @summary Enumerates the available sorting fields for query operations
 * @description The SortBy enum defines the fields that can be used for sorting
 * in various query operations across different entities.
 */

/**
 * Sort by enumeration for envelopes
 */
export enum EnvelopeSortBy {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  TITLE = 'title',
  STATUS = 'status',
  EXPIRES_AT = 'expiresAt'
}

/**
 * Sort by enumeration for signers
 */
export enum SignerSortBy {
  CREATED_AT = 'createdAt',
  ORDER = 'order',
  EMAIL = 'email',
  STATUS = 'status',
  FULL_NAME = 'fullName'
}

/**
 * Sort by enumeration for signatures
 */
export enum SignatureSortBy {
  TIMESTAMP = 'timestamp',
  CREATED_AT = 'createdAt',
  STATUS = 'status',
  ALGORITHM = 'algorithm'
}

/**
 * Sort by enumeration for audit events
 */
export enum AuditSortBy {
  TIMESTAMP = 'timestamp',
  TYPE = 'type',
  CREATED_AT = 'createdAt'
}

/**
 * Gets the display name for an envelope sort field
 */
export function getEnvelopeSortByDisplayName(field: EnvelopeSortBy): string {
  switch (field) {
    case EnvelopeSortBy.CREATED_AT:
      return 'Created Date';
    case EnvelopeSortBy.UPDATED_AT:
      return 'Updated Date';
    case EnvelopeSortBy.TITLE:
      return 'Title';
    case EnvelopeSortBy.STATUS:
      return 'Status';
    case EnvelopeSortBy.EXPIRES_AT:
      return 'Expiration Date';
    default:
      return 'Unknown';
  }
}

/**
 * Gets the display name for a signer sort field
 */
export function getSignerSortByDisplayName(field: SignerSortBy): string {
  switch (field) {
    case SignerSortBy.CREATED_AT:
      return 'Created Date';
    case SignerSortBy.ORDER:
      return 'Signing Order';
    case SignerSortBy.EMAIL:
      return 'Email';
    case SignerSortBy.STATUS:
      return 'Status';
    case SignerSortBy.FULL_NAME:
      return 'Full Name';
    default:
      return 'Unknown';
  }
}

/**
 * Gets the display name for a signature sort field
 */
export function getSignatureSortByDisplayName(field: SignatureSortBy): string {
  switch (field) {
    case SignatureSortBy.TIMESTAMP:
      return 'Signature Time';
    case SignatureSortBy.CREATED_AT:
      return 'Created Date';
    case SignatureSortBy.STATUS:
      return 'Status';
    case SignatureSortBy.ALGORITHM:
      return 'Algorithm';
    default:
      return 'Unknown';
  }
}

/**
 * Gets the display name for an audit sort field
 */
export function getAuditSortByDisplayName(field: AuditSortBy): string {
  switch (field) {
    case AuditSortBy.TIMESTAMP:
      return 'Event Time';
    case AuditSortBy.TYPE:
      return 'Event Type';
    case AuditSortBy.CREATED_AT:
      return 'Created Date';
    default:
      return 'Unknown';
  }
}
