/**
 * @fileoverview NotificationTemplateService Tests - Unit tests for NotificationTemplateService
 * @summary Tests for template rendering coordination
 * @description Comprehensive test suite for NotificationTemplateService covering template
 * rendering, metadata extraction, error handling, and fallback behavior.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { NotificationTemplateService } from '../../../../src/services/domain/NotificationTemplateService';
import { NotificationChannel, RecipientType } from '@prisma/client';
import type { NotificationRequest } from '../../../../src/domain/types/orchestrator';
import type { TemplateRenderResult } from '../../../../src/domain/types/template';

// Mock the mappers
jest.mock('../../../../src/domain/mappers', () => ({
  extractServiceFromMetadata: jest.fn((metadata?: Record<string, unknown>) => {
    if (metadata?.source === 'auth-service') return 'auth-service';
    return 'signature-service';
  }),
  extractEventTypeFromMetadata: jest.fn((metadata?: Record<string, unknown>) => {
    return metadata?.eventType || 'ENVELOPE_INVITATION';
  })
}));

describe('NotificationTemplateService', () => {
  let service: NotificationTemplateService;
  let mockEmailTemplateService: any;
  let mockLogger: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockEmailTemplateService = {
      render: jest.fn()
    };

    mockLogger = {
      warn: jest.fn(),
      info: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      child: jest.fn((context: any) => mockLogger)
    };

    service = new NotificationTemplateService(
      mockEmailTemplateService,
      mockLogger
    );
  });

  describe('renderEmailTemplate', () => {
    const createNotificationRequest = (overrides: Partial<NotificationRequest> = {}): NotificationRequest => ({
      channel: NotificationChannel.EMAIL,
      recipient: 'test@example.com',
      recipientType: RecipientType.EMAIL,
      subject: 'Test Subject',
      body: 'Test Body',
      language: 'en',
      ...overrides
    });

    it('renders email template successfully', async () => {
      const request = createNotificationRequest();
      const metadata = { source: 'signature-service', eventType: 'ENVELOPE_INVITATION' };
      const templateResult: TemplateRenderResult = {
        subject: 'Rendered Subject',
        htmlBody: '<p>Rendered HTML</p>',
        textBody: 'Rendered Text'
      };

      mockEmailTemplateService.render.mockResolvedValue(templateResult);

      const result = await service.renderEmailTemplate(request, metadata);

      expect(mockEmailTemplateService.render).toHaveBeenCalledWith(
        'signature-service',
        'ENVELOPE_INVITATION',
        request
      );
      expect(result).toEqual(templateResult);
      expect(mockLogger.warn).not.toHaveBeenCalled();
    });

    it('extracts service name from metadata', async () => {
      const request = createNotificationRequest();
      const metadata = { source: 'auth-service', eventType: 'UserRegistered' };
      const templateResult: TemplateRenderResult = {
        subject: 'Welcome',
        htmlBody: '<p>Welcome</p>',
        textBody: 'Welcome'
      };

      mockEmailTemplateService.render.mockResolvedValue(templateResult);

      await service.renderEmailTemplate(request, metadata);

      expect(mockEmailTemplateService.render).toHaveBeenCalledWith(
        'auth-service',
        'UserRegistered',
        request
      );
    });

    it('uses default service when metadata is undefined', async () => {
      const request = createNotificationRequest();
      const templateResult: TemplateRenderResult = {
        subject: 'Subject',
        htmlBody: '<p>Body</p>',
        textBody: 'Body'
      };

      mockEmailTemplateService.render.mockResolvedValue(templateResult);

      await service.renderEmailTemplate(request);

      expect(mockEmailTemplateService.render).toHaveBeenCalledWith(
        'signature-service',
        'ENVELOPE_INVITATION',
        request
      );
    });

    it('falls back to default content when template rendering fails', async () => {
      const request = createNotificationRequest({
        subject: 'Fallback Subject',
        body: 'Fallback Body'
      });
      const error = new Error('Template not found');

      mockEmailTemplateService.render.mockRejectedValue(error);

      const result = await service.renderEmailTemplate(request);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Failed to render email template, using default',
        expect.objectContaining({
          recipient: request.recipient,
          error: 'Template not found'
        })
      );
      expect(result).toEqual({
        subject: 'Fallback Subject',
        htmlBody: 'Fallback Body',
        textBody: 'Fallback Body'
      });
    });

    it('uses default subject when request subject is undefined in fallback', async () => {
      const request = createNotificationRequest({
        subject: undefined,
        body: 'Body'
      });
      const error = new Error('Template error');

      mockEmailTemplateService.render.mockRejectedValue(error);

      const result = await service.renderEmailTemplate(request);

      expect(result.subject).toBe('Notification');
      expect(result.htmlBody).toBe('Body');
      expect(result.textBody).toBe('Body');
    });

    it('handles template rendering errors with error message', async () => {
      const request = createNotificationRequest();
      const error = new Error('Template error');

      mockEmailTemplateService.render.mockRejectedValue(error);

      await service.renderEmailTemplate(request);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Failed to render email template, using default',
        expect.objectContaining({
          error: 'Template error',
          recipient: request.recipient
        })
      );
    });

    it('handles non-Error objects in catch block', async () => {
      const request = createNotificationRequest();
      const error = 'String error';

      mockEmailTemplateService.render.mockRejectedValue(error);

      const result = await service.renderEmailTemplate(request);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Failed to render email template, using default',
        expect.objectContaining({
          error: 'String error'
        })
      );
      expect(result).toBeDefined();
    });
  });
});

