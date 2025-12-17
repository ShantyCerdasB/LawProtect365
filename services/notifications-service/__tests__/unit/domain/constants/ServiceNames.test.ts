/**
 * @fileoverview ServiceNames Tests - Unit tests for ServiceNames
 * @summary Tests for service name constants and mapping
 * @description Comprehensive test suite for ServiceNames covering service
 * name mappings and source-to-name conversion.
 */

import { describe, it, expect } from '@jest/globals';
import { SERVICE_NAMES, getServiceNameFromSource } from '../../../../src/domain/constants/ServiceNames';
import { EventSource } from '../../../../src/domain/enums';

describe('ServiceNames', () => {
  describe('SERVICE_NAMES', () => {
    it('maps SIGNATURE_SERVICE to signature-service', () => {
      expect(SERVICE_NAMES[EventSource.SIGNATURE_SERVICE]).toBe('signature-service');
    });

    it('maps AUTH_SERVICE to auth-service', () => {
      expect(SERVICE_NAMES[EventSource.AUTH_SERVICE]).toBe('auth-service');
    });
  });

  describe('getServiceNameFromSource', () => {
    it('returns signature-service for SIGNATURE_SERVICE', () => {
      const result = getServiceNameFromSource(EventSource.SIGNATURE_SERVICE);
      expect(result).toBe('signature-service');
    });

    it('returns auth-service for AUTH_SERVICE', () => {
      const result = getServiceNameFromSource(EventSource.AUTH_SERVICE);
      expect(result).toBe('auth-service');
    });

    it('returns signature-service as default for unknown source', () => {
      const result = getServiceNameFromSource('unknown-source');
      expect(result).toBe('signature-service');
    });
  });
});

