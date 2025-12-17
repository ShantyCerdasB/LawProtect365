/**
 * @fileoverview MetadataMapper Tests - Unit tests for MetadataMapper
 * @summary Tests for metadata extraction utilities
 * @description Comprehensive test suite for MetadataMapper covering service
 * name and event type extraction from metadata.
 */

import { describe, it, expect } from '@jest/globals';
import { extractServiceFromMetadata, extractEventTypeFromMetadata } from '../../../../src/domain/mappers/MetadataMapper';
import { EventSource } from '../../../../src/domain/enums';

describe('MetadataMapper', () => {
  describe('extractServiceFromMetadata', () => {
    it('extracts service name from signature-service source', () => {
      const metadata = { source: EventSource.SIGNATURE_SERVICE };
      const result = extractServiceFromMetadata(metadata);
      expect(result).toBe('signature-service');
    });

    it('extracts service name from auth-service source', () => {
      const metadata = { source: EventSource.AUTH_SERVICE };
      const result = extractServiceFromMetadata(metadata);
      expect(result).toBe('auth-service');
    });

    it('returns default service name when source is missing', () => {
      const metadata = {};
      const result = extractServiceFromMetadata(metadata);
      expect(result).toBe('signature-service');
    });

    it('returns default service name when metadata is undefined', () => {
      const result = extractServiceFromMetadata(undefined);
      expect(result).toBe('signature-service');
    });
  });

  describe('extractEventTypeFromMetadata', () => {
    it('extracts event type from metadata', () => {
      const metadata = { eventType: 'ENVELOPE_INVITATION' };
      const result = extractEventTypeFromMetadata(metadata);
      expect(result).toBe('ENVELOPE_INVITATION');
    });

    it('returns default event type when eventType is missing', () => {
      const metadata = {};
      const result = extractEventTypeFromMetadata(metadata);
      expect(result).toBe('unknown');
    });

    it('returns default event type when metadata is undefined', () => {
      const result = extractEventTypeFromMetadata(undefined);
      expect(result).toBe('unknown');
    });
  });
});

