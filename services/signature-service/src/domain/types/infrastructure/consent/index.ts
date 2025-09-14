/**
 * @fileoverview Consent infrastructure types - Barrel exports for consent infrastructure
 * @summary Centralized exports for consent DynamoDB types and mappers
 * @description Provides centralized access to all consent-related infrastructure types,
 * mappers, and utilities for DynamoDB operations.
 */

// DynamoDB types
export type {
  ConsentDdbItem,
  ConsentListCursorPayload,
  ConsentQueryOptions
} from './consent-ddb-types';

export {
  ConsentKeyBuilders
} from './consent-ddb-types';

// Mappers and utilities
export {
  isConsentDdbItem,
  consentToDdbItem,
  consentFromDdbItem,
  createConsentFromRequest
} from './consent-mappers';

// Result types for consent operations
import type { Consent } from '../../../entities/Consent';

export interface ConsentListResult {
  items: Consent[];
  cursor?: string;
  hasMore: boolean;
}

export interface ConsentCountResult {
  count: number;
  envelopeId?: string;
  signerId?: string;
}
