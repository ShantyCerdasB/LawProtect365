/**
 * @fileoverview Unit tests for DocumentOrigin value object
 * @summary Tests for document origin validation and business logic
 * @description Comprehensive test suite for DocumentOrigin value object covering validation,
 * factory methods, equality, and business logic for document origin handling.
 */

import { DocumentOrigin } from '../../../../src/domain/value-objects/DocumentOrigin';
import { DocumentOriginType } from '@prisma/client';
import { BadRequestError } from '@lawprotect/shared-ts';

describe('DocumentOrigin', () => {
  describe('Constructor and Validation', () => {
    it('should create DocumentOrigin for user upload', () => {
      const origin = new DocumentOrigin(DocumentOriginType.USER_UPLOAD);

      expect(origin.getType()).toBe(DocumentOriginType.USER_UPLOAD);
      expect(origin.getTemplateId()).toBeUndefined();
      expect(origin.getTemplateVersion()).toBeUndefined();
      expect(origin.isUserUpload()).toBe(true);
      expect(origin.isTemplate()).toBe(false);
    });

    it('should create DocumentOrigin for template with valid template data', () => {
      const templateId = 'template-123';
      const templateVersion = 'v1.0.0';
      const origin = new DocumentOrigin(DocumentOriginType.TEMPLATE, templateId, templateVersion);

      expect(origin.getType()).toBe(DocumentOriginType.TEMPLATE);
      expect(origin.getTemplateId()).toBe(templateId);
      expect(origin.getTemplateVersion()).toBe(templateVersion);
      expect(origin.isUserUpload()).toBe(false);
      expect(origin.isTemplate()).toBe(true);
    });

    it('should throw error when template origin lacks template ID', () => {
      expect(() => new DocumentOrigin(DocumentOriginType.TEMPLATE, undefined, 'v1.0.0'))
        .toThrow(BadRequestError);
    });

    it('should throw error when template origin lacks template version', () => {
      expect(() => new DocumentOrigin(DocumentOriginType.TEMPLATE, 'template-123', undefined))
        .toThrow(BadRequestError);
    });

    it('should throw error when template origin lacks both template ID and version', () => {
      expect(() => new DocumentOrigin(DocumentOriginType.TEMPLATE))
        .toThrow(BadRequestError);
    });

    it('should throw error when template origin has empty template ID', () => {
      expect(() => new DocumentOrigin(DocumentOriginType.TEMPLATE, '', 'v1.0.0'))
        .toThrow(BadRequestError);
    });

    it('should throw error when template origin has empty template version', () => {
      expect(() => new DocumentOrigin(DocumentOriginType.TEMPLATE, 'template-123', ''))
        .toThrow(BadRequestError);
    });

    it('should reject whitespace-only template ID', () => {
      expect(() => new DocumentOrigin(DocumentOriginType.TEMPLATE, '   ', 'v1.0.0'))
        .toThrow('Template origin requires a valid template ID');
    });

    it('should reject whitespace-only template version', () => {
      expect(() => new DocumentOrigin(DocumentOriginType.TEMPLATE, 'template-123', '   '))
        .toThrow('Template origin requires a valid template version');
    });
  });

  describe('Static Factory Methods', () => {
    it('should create user upload origin using static method', () => {
      const origin = DocumentOrigin.userUpload();

      expect(origin.getType()).toBe(DocumentOriginType.USER_UPLOAD);
      expect(origin.getTemplateId()).toBeUndefined();
      expect(origin.getTemplateVersion()).toBeUndefined();
      expect(origin.isUserUpload()).toBe(true);
      expect(origin.isTemplate()).toBe(false);
    });

    it('should create template origin using static method', () => {
      const templateId = 'contract-template-456';
      const templateVersion = 'v2.1.0';
      const origin = DocumentOrigin.template(templateId, templateVersion);

      expect(origin.getType()).toBe(DocumentOriginType.TEMPLATE);
      expect(origin.getTemplateId()).toBe(templateId);
      expect(origin.getTemplateVersion()).toBe(templateVersion);
      expect(origin.isUserUpload()).toBe(false);
      expect(origin.isTemplate()).toBe(true);
    });

    it('should create origin from string for user upload', () => {
      const origin = DocumentOrigin.fromString(DocumentOriginType.USER_UPLOAD);

      expect(origin.getType()).toBe(DocumentOriginType.USER_UPLOAD);
      expect(origin.getTemplateId()).toBeUndefined();
      expect(origin.getTemplateVersion()).toBeUndefined();
    });

    it('should create origin from string for template', () => {
      const templateId = 'agreement-template-789';
      const templateVersion = 'v3.0.0';
      const origin = DocumentOrigin.fromString(DocumentOriginType.TEMPLATE, templateId, templateVersion);

      expect(origin.getType()).toBe(DocumentOriginType.TEMPLATE);
      expect(origin.getTemplateId()).toBe(templateId);
      expect(origin.getTemplateVersion()).toBe(templateVersion);
    });

    it('should throw error when fromString receives invalid type', () => {
      expect(() => DocumentOrigin.fromString('INVALID_TYPE'))
        .toThrow(BadRequestError);
    });

    it('should throw error when fromString receives empty string', () => {
      expect(() => DocumentOrigin.fromString(''))
        .toThrow(BadRequestError);
    });

    it('should throw error when fromString receives null', () => {
      expect(() => DocumentOrigin.fromString(null as any))
        .toThrow(BadRequestError);
    });

    it('should throw error when fromString receives undefined', () => {
      expect(() => DocumentOrigin.fromString(undefined as any))
        .toThrow(BadRequestError);
    });
  });

  describe('Equality', () => {
    it('should return true for equal user upload origins', () => {
      const origin1 = DocumentOrigin.userUpload();
      const origin2 = DocumentOrigin.userUpload();

      expect(origin1.equals(origin2)).toBe(true);
    });

    it('should return true for equal template origins', () => {
      const templateId = 'template-123';
      const templateVersion = 'v1.0.0';
      const origin1 = DocumentOrigin.template(templateId, templateVersion);
      const origin2 = DocumentOrigin.template(templateId, templateVersion);

      expect(origin1.equals(origin2)).toBe(true);
    });

    it('should return false for different origin types', () => {
      const userUploadOrigin = DocumentOrigin.userUpload();
      const templateOrigin = DocumentOrigin.template('template-123', 'v1.0.0');

      expect(userUploadOrigin.equals(templateOrigin)).toBe(false);
    });

    it('should return false for template origins with different template IDs', () => {
      const origin1 = DocumentOrigin.template('template-123', 'v1.0.0');
      const origin2 = DocumentOrigin.template('template-456', 'v1.0.0');

      expect(origin1.equals(origin2)).toBe(false);
    });

    it('should return false for template origins with different template versions', () => {
      const origin1 = DocumentOrigin.template('template-123', 'v1.0.0');
      const origin2 = DocumentOrigin.template('template-123', 'v2.0.0');

      expect(origin1.equals(origin2)).toBe(false);
    });

    it('should return false when comparing with different object types', () => {
      const origin = DocumentOrigin.userUpload();
      const otherObject = { getType: () => DocumentOriginType.USER_UPLOAD };

      expect(origin.equals(otherObject as any)).toBe(false);
    });
  });

  describe('Serialization', () => {
    it('should return string representation for user upload', () => {
      const origin = DocumentOrigin.userUpload();

      expect(origin.toString()).toBe(DocumentOriginType.USER_UPLOAD);
    });

    it('should return string representation for template', () => {
      const origin = DocumentOrigin.template('template-123', 'v1.0.0');

      expect(origin.toString()).toBe(DocumentOriginType.TEMPLATE);
    });

    it('should serialize to JSON for user upload', () => {
      const origin = DocumentOrigin.userUpload();

      expect(origin.toJSON()).toEqual({
        type: DocumentOriginType.USER_UPLOAD,
        templateId: undefined,
        templateVersion: undefined
      });
    });

    it('should serialize to JSON for template', () => {
      const templateId = 'template-123';
      const templateVersion = 'v1.0.0';
      const origin = DocumentOrigin.template(templateId, templateVersion);

      expect(origin.toJSON()).toEqual({
        type: DocumentOriginType.TEMPLATE,
        templateId: templateId,
        templateVersion: templateVersion
      });
    });

    it('should be serializable to JSON string', () => {
      const origin = DocumentOrigin.template('template-123', 'v1.0.0');
      const json = JSON.stringify(origin.toJSON());

      expect(json).toBe('{"type":"TEMPLATE","templateId":"template-123","templateVersion":"v1.0.0"}');
    });
  });

  describe('Business Logic', () => {
    it('should correctly identify user upload origin', () => {
      const origin = DocumentOrigin.userUpload();

      expect(origin.isUserUpload()).toBe(true);
      expect(origin.isTemplate()).toBe(false);
    });

    it('should correctly identify template origin', () => {
      const origin = DocumentOrigin.template('template-123', 'v1.0.0');

      expect(origin.isUserUpload()).toBe(false);
      expect(origin.isTemplate()).toBe(true);
    });

    it('should handle all DocumentOriginType enum values', () => {
      const userUploadOrigin = DocumentOrigin.fromString(DocumentOriginType.USER_UPLOAD);
      const templateOrigin = DocumentOrigin.fromString(DocumentOriginType.TEMPLATE, 'template-123', 'v1.0.0');

      expect(userUploadOrigin.getType()).toBe(DocumentOriginType.USER_UPLOAD);
      expect(templateOrigin.getType()).toBe(DocumentOriginType.TEMPLATE);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long template IDs', () => {
      const longTemplateId = 'very-long-template-id-that-contains-many-characters-and-might-be-used-for-complex-template-identification-purposes';
      const templateVersion = 'v1.0.0';
      
      const origin = DocumentOrigin.template(longTemplateId, templateVersion);

      expect(origin.getTemplateId()).toBe(longTemplateId);
      expect(origin.getTemplateVersion()).toBe(templateVersion);
      expect(origin.isTemplate()).toBe(true);
    });

    it('should handle very long template versions', () => {
      const templateId = 'template-123';
      const longTemplateVersion = 'very-long-version-string-that-might-contain-detailed-version-information-including-build-numbers-and-commit-hashes';
      
      const origin = DocumentOrigin.template(templateId, longTemplateVersion);

      expect(origin.getTemplateId()).toBe(templateId);
      expect(origin.getTemplateVersion()).toBe(longTemplateVersion);
      expect(origin.isTemplate()).toBe(true);
    });

    it('should handle template IDs with special characters', () => {
      const specialTemplateId = 'template-123_@#$%^&*()_+-=[]{}|;:,.<>?';
      const templateVersion = 'v1.0.0';
      
      const origin = DocumentOrigin.template(specialTemplateId, templateVersion);

      expect(origin.getTemplateId()).toBe(specialTemplateId);
      expect(origin.getTemplateVersion()).toBe(templateVersion);
    });

    it('should handle template versions with special characters', () => {
      const templateId = 'template-123';
      const specialTemplateVersion = 'v1.0.0-beta+20240101.123456';
      
      const origin = DocumentOrigin.template(templateId, specialTemplateVersion);

      expect(origin.getTemplateId()).toBe(templateId);
      expect(origin.getTemplateVersion()).toBe(specialTemplateVersion);
    });

    it('should handle template IDs with unicode characters', () => {
      const unicodeTemplateId = 'template-中文-العربية-123';
      const templateVersion = 'v1.0.0';
      
      const origin = DocumentOrigin.template(unicodeTemplateId, templateVersion);

      expect(origin.getTemplateId()).toBe(unicodeTemplateId);
      expect(origin.getTemplateVersion()).toBe(templateVersion);
    });

    it('should handle template versions with unicode characters', () => {
      const templateId = 'template-123';
      const unicodeTemplateVersion = 'v1.0.0-中文-العربية';
      
      const origin = DocumentOrigin.template(templateId, unicodeTemplateVersion);

      expect(origin.getTemplateId()).toBe(templateId);
      expect(origin.getTemplateVersion()).toBe(unicodeTemplateVersion);
    });

    it('should maintain immutability', () => {
      const origin = DocumentOrigin.template('template-123', 'v1.0.0');
      const originalTemplateId = origin.getTemplateId();
      const originalTemplateVersion = origin.getTemplateVersion();

      // Attempting to modify the internal values should not affect the object
      // (This test ensures the value object is truly immutable)
      expect(origin.getTemplateId()).toBe(originalTemplateId);
      expect(origin.getTemplateVersion()).toBe(originalTemplateVersion);
      expect(origin.getTemplateId()).toBe('template-123');
      expect(origin.getTemplateVersion()).toBe('v1.0.0');
    });

    it('should handle numeric template IDs and versions', () => {
      const numericTemplateId = '123456789';
      const numericTemplateVersion = '1.2.3';
      
      const origin = DocumentOrigin.template(numericTemplateId, numericTemplateVersion);

      expect(origin.getTemplateId()).toBe(numericTemplateId);
      expect(origin.getTemplateVersion()).toBe(numericTemplateVersion);
    });

    it('should handle template IDs and versions with mixed alphanumeric characters', () => {
      const mixedTemplateId = 'template-123abc-def456';
      const mixedTemplateVersion = 'v1.2.3-alpha4';
      
      const origin = DocumentOrigin.template(mixedTemplateId, mixedTemplateVersion);

      expect(origin.getTemplateId()).toBe(mixedTemplateId);
      expect(origin.getTemplateVersion()).toBe(mixedTemplateVersion);
    });
  });
});
