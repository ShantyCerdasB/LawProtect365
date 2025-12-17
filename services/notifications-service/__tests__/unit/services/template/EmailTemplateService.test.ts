/**
 * @fileoverview EmailTemplateService Tests - Unit tests for EmailTemplateService
 * @summary Tests for email template rendering with i18n support
 * @description Comprehensive test suite for EmailTemplateService covering template loading,
 * rendering, variable interpolation, HTML to text conversion, and error handling.
 */

import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { EmailTemplateService } from '../../../../src/services/template/EmailTemplateService';
import type { NotificationRequest } from '../../../../src/domain/types/orchestrator';
import { RecipientType } from '@prisma/client';
import { templateRenderFailed } from '../../../../src/notification-errors';

describe('EmailTemplateService', () => {
  let tempDir: string;
  let service: EmailTemplateService;
  let templatesDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'templates-'));
    templatesDir = path.join(tempDir, 'email');
    fs.mkdirSync(templatesDir, { recursive: true });
    service = new EmailTemplateService(templatesDir);
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('constructor', () => {
    it('should use default templates path when not provided', () => {
      const defaultService = new EmailTemplateService();
      expect(defaultService).toBeInstanceOf(EmailTemplateService);
    });

    it('should use provided templates path', () => {
      expect(service).toBeInstanceOf(EmailTemplateService);
    });
  });

  describe('render', () => {
    it('should render template with HTML body', async () => {
      const serviceDir = path.join(templatesDir, 'signature-service', 'envelope-invitation');
      fs.mkdirSync(serviceDir, { recursive: true });
      fs.writeFileSync(
        path.join(serviceDir, 'en.html'),
        '<html><body>Hello {{recipient}}, you have a document to sign.</body></html>'
      );

      const request: NotificationRequest = {
        channel: 'EMAIL' as const,
        recipient: 'test@example.com',
        recipientType: RecipientType.EMAIL,
        body: 'Default body',
        language: 'en',
      };

      const result = await service.render('signature-service', 'ENVELOPE_INVITATION', request);

      expect(result.htmlBody).toContain('Hello test@example.com');
      expect(result.htmlBody).toContain('you have a document to sign');
      expect(result.subject).toBe('Notification');
      expect(result.textBody).toContain('Hello test@example.com');
    });

    it('should render template with subject', async () => {
      const serviceDir = path.join(templatesDir, 'signature-service', 'envelope-invitation');
      fs.mkdirSync(serviceDir, { recursive: true });
      fs.writeFileSync(path.join(serviceDir, 'en.html'), '<html><body>Body</body></html>');
      fs.writeFileSync(path.join(serviceDir, 'subject.en.txt'), 'Document to sign: {{recipient}}');

      const request: NotificationRequest = {
        channel: 'EMAIL' as const,
        recipient: 'user@example.com',
        recipientType: RecipientType.EMAIL,
        body: 'Default body',
        language: 'en',
      };

      const result = await service.render('signature-service', 'ENVELOPE_INVITATION', request);

      expect(result.subject).toBe('Document to sign: user@example.com');
      expect(result.htmlBody).toContain('Body');
    });

    it('should use default body and subject when templates not found', async () => {
      const request: NotificationRequest = {
        channel: 'EMAIL' as const,
        recipient: 'test@example.com',
        recipientType: RecipientType.EMAIL,
        body: 'Default body text',
        subject: 'Default subject',
        language: 'en',
      };

      const result = await service.render('signature-service', 'ENVELOPE_INVITATION', request);

      expect(result.subject).toBe('Default subject');
      expect(result.htmlBody).toBe('Default body text');
      expect(result.textBody).toBe('Default body text');
    });

    it('should use htmlBody when provided and no template', async () => {
      const request: NotificationRequest = {
        channel: 'EMAIL' as const,
        recipient: 'test@example.com',
        recipientType: RecipientType.EMAIL,
        body: 'Plain text body',
        htmlBody: '<html><body>HTML body</body></html>',
        language: 'en',
      };

      const result = await service.render('signature-service', 'ENVELOPE_INVITATION', request);

      expect(result.htmlBody).toBe('<html><body>HTML body</body></html>');
      expect(result.textBody).toBe('HTML body');
    });

    it('should use default language when not specified', async () => {
      const serviceDir = path.join(templatesDir, 'signature-service', 'envelope-invitation');
      fs.mkdirSync(serviceDir, { recursive: true });
      fs.writeFileSync(path.join(serviceDir, 'en.html'), '<html><body>English template</body></html>');

      const request: NotificationRequest = {
        channel: 'EMAIL' as const,
        recipient: 'test@example.com',
        recipientType: RecipientType.EMAIL,
        body: 'Default',
      };

      const result = await service.render('signature-service', 'ENVELOPE_INVITATION', request);

      expect(result.htmlBody).toContain('English template');
    });

    it('should interpolate variables in template', async () => {
      const serviceDir = path.join(templatesDir, 'signature-service', 'envelope-invitation');
      fs.mkdirSync(serviceDir, { recursive: true });
      fs.writeFileSync(
        path.join(serviceDir, 'en.html'),
        '<html><body>Hello {{name}}, envelope {{envelopeId}}</body></html>'
      );

      const request: NotificationRequest = {
        channel: 'EMAIL' as const,
        recipient: 'test@example.com',
        recipientType: RecipientType.EMAIL,
        body: 'Default',
        language: 'en',
        metadata: {
          name: 'John Doe',
          envelopeId: 'env-123',
        },
      };

      const result = await service.render('signature-service', 'ENVELOPE_INVITATION', request);

      expect(result.htmlBody).toContain('Hello John Doe');
      expect(result.htmlBody).toContain('envelope env-123');
    });

    it('should normalize event type to filesystem-safe name', async () => {
      const serviceDir = path.join(templatesDir, 'signature-service', 'signer-declined');
      fs.mkdirSync(serviceDir, { recursive: true });
      fs.writeFileSync(path.join(serviceDir, 'en.html'), '<html><body>Declined template</body></html>');

      const request: NotificationRequest = {
        channel: 'EMAIL' as const,
        recipient: 'test@example.com',
        recipientType: RecipientType.EMAIL,
        body: 'Default',
        language: 'en',
      };

      const result = await service.render('signature-service', 'SIGNER_DECLINED', request);

      expect(result.htmlBody).toContain('Declined template');
    });

    it('should handle different services', async () => {
      const authServiceDir = path.join(templatesDir, 'auth-service', 'user-registered');
      fs.mkdirSync(authServiceDir, { recursive: true });
      fs.writeFileSync(path.join(authServiceDir, 'en.html'), '<html><body>Welcome {{recipient}}</body></html>');

      const request: NotificationRequest = {
        channel: 'EMAIL' as const,
        recipient: 'newuser@example.com',
        recipientType: RecipientType.EMAIL,
        body: 'Default',
        language: 'en',
      };

      const result = await service.render('auth-service', 'USER_REGISTERED', request);

      expect(result.htmlBody).toContain('Welcome newuser@example.com');
    });

    it('should trim subject and body', async () => {
      const serviceDir = path.join(templatesDir, 'signature-service', 'envelope-invitation');
      fs.mkdirSync(serviceDir, { recursive: true });
      fs.writeFileSync(path.join(serviceDir, 'en.html'), '  <html><body>Body</body></html>  ');
      fs.writeFileSync(path.join(serviceDir, 'subject.en.txt'), '  Subject  ');

      const request: NotificationRequest = {
        channel: 'EMAIL' as const,
        recipient: 'test@example.com',
        recipientType: RecipientType.EMAIL,
        body: 'Default',
        language: 'en',
      };

      const result = await service.render('signature-service', 'ENVELOPE_INVITATION', request);

      expect(result.subject).toBe('Subject');
      expect(result.htmlBody).toBe('<html><body>Body</body></html>');
    });

    it('should throw templateRenderFailed when template read fails', async () => {
      const serviceDir = path.join(templatesDir, 'signature-service', 'envelope-invitation');
      fs.mkdirSync(serviceDir, { recursive: true });
      const templatePath = path.join(serviceDir, 'en.html');
      fs.writeFileSync(templatePath, '<html><body>Test</body></html>');
      
      const readFileSpy = jest.spyOn(fs.promises, 'readFile').mockRejectedValueOnce(new Error('Read error'));

      const request: NotificationRequest = {
        channel: 'EMAIL' as const,
        recipient: 'test@example.com',
        recipientType: RecipientType.EMAIL,
        body: 'Default',
        language: 'en',
      };

      await expect(service.render('signature-service', 'ENVELOPE_INVITATION', request)).rejects.toThrow();
      
      expect(readFileSpy).toHaveBeenCalled();
      readFileSpy.mockRestore();
    });
  });

  describe('htmlToText', () => {
    it('should convert HTML to plain text', async () => {
      const serviceDir = path.join(templatesDir, 'signature-service', 'envelope-invitation');
      fs.mkdirSync(serviceDir, { recursive: true });
      fs.writeFileSync(
        path.join(serviceDir, 'en.html'),
        '<html><body><p>Hello <strong>world</strong></p></body></html>'
      );

      const request: NotificationRequest = {
        channel: 'EMAIL' as const,
        recipient: 'test@example.com',
        recipientType: RecipientType.EMAIL,
        body: 'Default',
        language: 'en',
      };

      const result = await service.render('signature-service', 'ENVELOPE_INVITATION', request);

      expect(result.textBody).toBe('Hello world');
    });

    it('should handle HTML entities', async () => {
      const serviceDir = path.join(templatesDir, 'signature-service', 'envelope-invitation');
      fs.mkdirSync(serviceDir, { recursive: true });
      fs.writeFileSync(
        path.join(serviceDir, 'en.html'),
        '<html><body>Text &amp; more &lt;tag&gt; &quot;quote&quot;</body></html>'
      );

      const request: NotificationRequest = {
        channel: 'EMAIL' as const,
        recipient: 'test@example.com',
        recipientType: RecipientType.EMAIL,
        body: 'Default',
        language: 'en',
      };

      const result = await service.render('signature-service', 'ENVELOPE_INVITATION', request);

      expect(result.textBody).toBe('Text & more <tag> "quote"');
    });

    it('should handle &nbsp; entity', async () => {
      const serviceDir = path.join(templatesDir, 'signature-service', 'envelope-invitation');
      fs.mkdirSync(serviceDir, { recursive: true });
      fs.writeFileSync(path.join(serviceDir, 'en.html'), '<html><body>Hello&nbsp;World</body></html>');

      const request: NotificationRequest = {
        channel: 'EMAIL' as const,
        recipient: 'test@example.com',
        recipientType: RecipientType.EMAIL,
        body: 'Default',
        language: 'en',
      };

      const result = await service.render('signature-service', 'ENVELOPE_INVITATION', request);

      expect(result.textBody).toBe('Hello World');
    });
  });

  describe('normalizeEventType', () => {
    it('should convert uppercase to lowercase', async () => {
      const serviceDir = path.join(templatesDir, 'signature-service', 'envelope-invitation');
      fs.mkdirSync(serviceDir, { recursive: true });
      fs.writeFileSync(path.join(serviceDir, 'en.html'), '<html><body>Test</body></html>');

      const request: NotificationRequest = {
        channel: 'EMAIL' as const,
        recipient: 'test@example.com',
        recipientType: RecipientType.EMAIL,
        body: 'Default',
        language: 'en',
      };

      await expect(
        service.render('signature-service', 'ENVELOPE_INVITATION', request)
      ).resolves.toBeDefined();
    });

    it('should replace underscores with hyphens', async () => {
      const serviceDir = path.join(templatesDir, 'signature-service', 'document-view-invitation');
      fs.mkdirSync(serviceDir, { recursive: true });
      fs.writeFileSync(path.join(serviceDir, 'en.html'), '<html><body>View template</body></html>');

      const request: NotificationRequest = {
        channel: 'EMAIL' as const,
        recipient: 'test@example.com',
        recipientType: RecipientType.EMAIL,
        body: 'Default',
        language: 'en',
      };

      const result = await service.render('signature-service', 'DOCUMENT_VIEW_INVITATION', request);

      expect(result.htmlBody).toContain('View template');
    });
  });
});

