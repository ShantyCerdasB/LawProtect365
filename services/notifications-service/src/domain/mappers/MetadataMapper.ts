/**
 * @fileoverview MetadataMapper - Mapper for extracting metadata from events
 * @summary Extracts service names and event types from event metadata
 * @description Provides utilities for extracting service names and event types
 * from event metadata for template lookup and routing purposes.
 */

import { PayloadExtractor } from '../utils';
import { getServiceNameFromSource, DEFAULT_SERVICE_NAME } from '../constants';
import { DEFAULT_EVENT_TYPE } from '../constants';

/**
 * Extracts service name from metadata for template lookup
 * @param {Record<string, unknown> | undefined} metadata - Event metadata
 * @returns {string} Service name (default: 'signature-service')
 */
export function extractServiceFromMetadata(metadata?: Record<string, unknown>): string {
  const source = PayloadExtractor.extractString(metadata || {}, 'source');
  if (!source) {
    return DEFAULT_SERVICE_NAME;
  }
  return getServiceNameFromSource(source);
}

/**
 * Extracts event type from metadata for template lookup
 * @param {Record<string, unknown> | undefined} metadata - Event metadata
 * @returns {string} Event type (default: 'unknown')
 */
export function extractEventTypeFromMetadata(metadata?: Record<string, unknown>): string {
  return PayloadExtractor.extractString(metadata || {}, 'eventType') || DEFAULT_EVENT_TYPE;
}

