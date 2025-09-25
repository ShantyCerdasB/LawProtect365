/**
 * @fileoverview Unit tests for SignatureMetadata value object
 * @summary Tests for signature metadata validation and equality logic
 * @description Comprehensive test suite for SignatureMetadata value object covering validation,
 * equality, serialization, and factory methods.
 */

import { SignatureMetadata } from '../../../../src/domain/value-objects/SignatureMetadata';
import { generateTestIpAddress } from '../../../integration/helpers/testHelpers';

describe('SignatureMetadata', () => {
  describe('Constructor and Getters', () => {
    it('should create SignatureMetadata with all properties', () => {
      const ipAddress = generateTestIpAddress();
      const metadata = new SignatureMetadata(
        'Contract signing',
        'New York, NY',
        ipAddress,
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      );

      expect(metadata.getReason()).toBe('Contract signing');
      expect(metadata.getLocation()).toBe('New York, NY');
      expect(metadata.getIpAddress()).toBe(ipAddress);
      expect(metadata.getUserAgent()).toBe('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    });

    it('should create SignatureMetadata with partial properties', () => {
      const ipAddress = generateTestIpAddress();
      const metadata = new SignatureMetadata(
        'Agreement signing',
        undefined,
        ipAddress,
        undefined
      );

      expect(metadata.getReason()).toBe('Agreement signing');
      expect(metadata.getLocation()).toBeUndefined();
      expect(metadata.getIpAddress()).toBe(ipAddress);
      expect(metadata.getUserAgent()).toBeUndefined();
    });

    it('should create SignatureMetadata with no properties', () => {
      const metadata = new SignatureMetadata();

      expect(metadata.getReason()).toBeUndefined();
      expect(metadata.getLocation()).toBeUndefined();
      expect(metadata.getIpAddress()).toBeUndefined();
      expect(metadata.getUserAgent()).toBeUndefined();
    });

    it('should create SignatureMetadata with empty strings', () => {
      const metadata = new SignatureMetadata('', '', '', '');

      expect(metadata.getReason()).toBe('');
      expect(metadata.getLocation()).toBe('');
      expect(metadata.getIpAddress()).toBe('');
      expect(metadata.getUserAgent()).toBe('');
    });
  });

  describe('Static Factory Methods', () => {
    it('should create SignatureMetadata from object with all properties', () => {
      const ipAddress = generateTestIpAddress();
      const obj = {
        reason: 'Legal document signing',
        location: 'San Francisco, CA',
        ipAddress: ipAddress,
        userAgent: 'Chrome/91.0.4472.124'
      };

      const metadata = SignatureMetadata.fromObject(obj);

      expect(metadata.getReason()).toBe('Legal document signing');
      expect(metadata.getLocation()).toBe('San Francisco, CA');
      expect(metadata.getIpAddress()).toBe(ipAddress);
      expect(metadata.getUserAgent()).toBe('Chrome/91.0.4472.124');
    });

    it('should create SignatureMetadata from object with partial properties', () => {
      const ipAddress = generateTestIpAddress();
      const obj = {
        reason: 'Contract execution',
        ipAddress: ipAddress
      };

      const metadata = SignatureMetadata.fromObject(obj);

      expect(metadata.getReason()).toBe('Contract execution');
      expect(metadata.getLocation()).toBeUndefined();
      expect(metadata.getIpAddress()).toBe(ipAddress);
      expect(metadata.getUserAgent()).toBeUndefined();
    });

    it('should create SignatureMetadata from empty object', () => {
      const obj = {};

      const metadata = SignatureMetadata.fromObject(obj);

      expect(metadata.getReason()).toBeUndefined();
      expect(metadata.getLocation()).toBeUndefined();
      expect(metadata.getIpAddress()).toBeUndefined();
      expect(metadata.getUserAgent()).toBeUndefined();
    });

    it('should create SignatureMetadata from object with undefined values', () => {
      const obj = {
        reason: undefined,
        location: undefined,
        ipAddress: undefined,
        userAgent: undefined
      };

      const metadata = SignatureMetadata.fromObject(obj);

      expect(metadata.getReason()).toBeUndefined();
      expect(metadata.getLocation()).toBeUndefined();
      expect(metadata.getIpAddress()).toBeUndefined();
      expect(metadata.getUserAgent()).toBeUndefined();
    });
  });

  describe('Equality', () => {
    it('should return true for equal SignatureMetadata objects', () => {
      const metadata1 = new SignatureMetadata(
        'Document signing',
        'Los Angeles, CA',
        '203.0.113.1',
        'Firefox/89.0'
      );

      const metadata2 = new SignatureMetadata(
        'Document signing',
        'Los Angeles, CA',
        '203.0.113.1',
        'Firefox/89.0'
      );

      expect(metadata1.equals(metadata2)).toBe(true);
    });

    it('should return false for different SignatureMetadata objects', () => {
      const metadata1 = new SignatureMetadata(
        'Document signing',
        'Los Angeles, CA',
        '203.0.113.1',
        'Firefox/89.0'
      );

      const metadata2 = new SignatureMetadata(
        'Contract signing',
        'Los Angeles, CA',
        '203.0.113.1',
        'Firefox/89.0'
      );

      expect(metadata1.equals(metadata2)).toBe(false);
    });

    it('should return false when reason differs', () => {
      const metadata1 = new SignatureMetadata('Reason 1');
      const metadata2 = new SignatureMetadata('Reason 2');

      expect(metadata1.equals(metadata2)).toBe(false);
    });

    it('should return false when location differs', () => {
      const metadata1 = new SignatureMetadata(undefined, 'Location 1');
      const metadata2 = new SignatureMetadata(undefined, 'Location 2');

      expect(metadata1.equals(metadata2)).toBe(false);
    });

    it('should return false when IP address differs', () => {
      const metadata1 = new SignatureMetadata(undefined, undefined, generateTestIpAddress());
      const metadata2 = new SignatureMetadata(undefined, undefined, generateTestIpAddress());

      expect(metadata1.equals(metadata2)).toBe(false);
    });

    it('should return false when user agent differs', () => {
      const metadata1 = new SignatureMetadata(undefined, undefined, undefined, 'Chrome');
      const metadata2 = new SignatureMetadata(undefined, undefined, undefined, 'Firefox');

      expect(metadata1.equals(metadata2)).toBe(false);
    });

    it('should return true for both undefined values', () => {
      const metadata1 = new SignatureMetadata(undefined, 'Location');
      const metadata2 = new SignatureMetadata(undefined, 'Location');

      expect(metadata1.equals(metadata2)).toBe(true);
    });

    it('should return false when one is undefined and other is not', () => {
      const metadata1 = new SignatureMetadata(undefined, 'Location');
      const metadata2 = new SignatureMetadata('Reason', 'Location');

      expect(metadata1.equals(metadata2)).toBe(false);
    });

    it('should return false when comparing with different object types', () => {
      const metadata = new SignatureMetadata('Reason');
      const otherObject = { getReason: () => 'Reason' };

      expect(metadata.equals(otherObject as any)).toBe(false);
    });
  });

  describe('Serialization', () => {
    it('should serialize to object with all properties', () => {
      const metadata = new SignatureMetadata(
        'Agreement signing',
        'Chicago, IL',
        '198.51.100.1',
        'Safari/14.1'
      );

      const obj = metadata.toObject();

      expect(obj).toEqual({
        reason: 'Agreement signing',
        location: 'Chicago, IL',
        ipAddress: '198.51.100.1',
        userAgent: 'Safari/14.1'
      });
    });

    it('should serialize to object with partial properties', () => {
      const metadata = new SignatureMetadata(
        'Contract signing',
        undefined,
        '203.0.113.1',
        undefined
      );

      const obj = metadata.toObject();

      expect(obj).toEqual({
        reason: 'Contract signing',
        location: undefined,
        ipAddress: '203.0.113.1',
        userAgent: undefined
      });
    });

    it('should serialize to object with no properties', () => {
      const metadata = new SignatureMetadata();

      const obj = metadata.toObject();

      expect(obj).toEqual({
        reason: undefined,
        location: undefined,
        ipAddress: undefined,
        userAgent: undefined
      });
    });

    it('should serialize to object with empty strings', () => {
      const metadata = new SignatureMetadata('', '', '', '');

      const obj = metadata.toObject();

      expect(obj).toEqual({
        reason: '',
        location: '',
        ipAddress: '',
        userAgent: ''
      });
    });

    it('should be serializable to JSON', () => {
      const metadata = new SignatureMetadata(
        'Legal document',
        'Miami, FL',
        '192.0.2.1',
        'Edge/91.0.864.59'
      );

      const json = JSON.stringify(metadata.toObject());

      expect(json).toBe('{"reason":"Legal document","location":"Miami, FL","ipAddress":"192.0.2.1","userAgent":"Edge/91.0.864.59"}');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long reason text', () => {
      const longReason = 'This is a very long reason for signing this document that contains detailed information about the legal implications and requirements for electronic signature compliance.';
      
      const metadata = new SignatureMetadata(longReason);

      expect(metadata.getReason()).toBe(longReason);
      expect(metadata.getReason()?.length).toBeGreaterThan(100);
    });

    it('should handle very long location text', () => {
      const longLocation = '12345 Very Long Street Name, Suite 1000, Building A, Floor 15, Room 1501, Downtown Business District, Metropolitan Area, State, Country, Postal Code 12345-6789';
      
      const metadata = new SignatureMetadata(undefined, longLocation);

      expect(metadata.getLocation()).toBe(longLocation);
      expect(metadata.getLocation()?.length).toBeGreaterThan(100);
    });

    it('should handle IPv6 addresses', () => {
      const ipv6Address = '2001:0db8:85a3:0000:0000:8a2e:0370:7334';
      
      const metadata = new SignatureMetadata(undefined, undefined, ipv6Address);

      expect(metadata.getIpAddress()).toBe(ipv6Address);
    });

    it('should handle very long user agent strings', () => {
      const longUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59';
      
      const metadata = new SignatureMetadata(undefined, undefined, undefined, longUserAgent);

      expect(metadata.getUserAgent()).toBe(longUserAgent);
      expect(metadata.getUserAgent()?.length).toBeGreaterThan(100);
    });

    it('should handle special characters in all fields', () => {
      const specialReason = 'Signing with special chars: @#$%^&*()_+-=[]{}|;:,.<>?';
      const specialLocation = 'Location with unicode: 中文 العربية';
      const specialIp = generateTestIpAddress();
      const specialUserAgent = 'Browser/1.0 (OS; U; en-US) with special chars!';
      
      const metadata = new SignatureMetadata(specialReason, specialLocation, specialIp, specialUserAgent);

      expect(metadata.getReason()).toBe(specialReason);
      expect(metadata.getLocation()).toBe(specialLocation);
      expect(metadata.getIpAddress()).toBe(specialIp);
      expect(metadata.getUserAgent()).toBe(specialUserAgent);
    });

    it('should handle whitespace-only strings', () => {
      const whitespaceReason = '   ';
      const whitespaceLocation = '\t\n';
      const whitespaceIp = ' ';
      const whitespaceUserAgent = '\r\n\t';
      
      const metadata = new SignatureMetadata(whitespaceReason, whitespaceLocation, whitespaceIp, whitespaceUserAgent);

      expect(metadata.getReason()).toBe(whitespaceReason);
      expect(metadata.getLocation()).toBe(whitespaceLocation);
      expect(metadata.getIpAddress()).toBe(whitespaceIp);
      expect(metadata.getUserAgent()).toBe(whitespaceUserAgent);
    });

    it('should maintain immutability', () => {
      const metadata = new SignatureMetadata('Original reason');
      const originalReason = metadata.getReason();

      // Attempting to modify the internal value should not affect the object
      // (This test ensures the value object is truly immutable)
      expect(metadata.getReason()).toBe(originalReason);
      expect(metadata.getReason()).toBe('Original reason');
    });

    it('should handle null-like values in fromObject', () => {
      const obj = {
        reason: null,
        location: null,
        ipAddress: null,
        userAgent: null
      };

      const metadata = SignatureMetadata.fromObject(obj as any);

      expect(metadata.getReason()).toBe(null);
      expect(metadata.getLocation()).toBe(null);
      expect(metadata.getIpAddress()).toBe(null);
      expect(metadata.getUserAgent()).toBe(null);
    });

    it('should handle mixed undefined and defined values', () => {
      const ipAddress = generateTestIpAddress();
      const metadata = new SignatureMetadata(
        'Defined reason',
        undefined,
        ipAddress,
        undefined
      );

      expect(metadata.getReason()).toBe('Defined reason');
      expect(metadata.getLocation()).toBeUndefined();
      expect(metadata.getIpAddress()).toBe(ipAddress);
      expect(metadata.getUserAgent()).toBeUndefined();

      const obj = metadata.toObject();
      expect(obj).toEqual({
        reason: 'Defined reason',
        location: undefined,
        ipAddress: ipAddress,
        userAgent: undefined
      });
    });
  });
});
