/**
 * @fileoverview EmailService Tests - Unit tests for EmailService
 * @summary Tests for SES email sending operations
 * @description Comprehensive test suite for EmailService covering email sending,
 * bulk operations, validation, message building, and error handling.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { SESClient, SendEmailCommand, type SendEmailCommandOutput } from '@aws-sdk/client-ses';
import { EmailService } from '../../../../src/services/email/EmailService';
import type { SendEmailRequest } from '../../../../src/domain/types/email';
import { emailSendFailed } from '../../../../src/notification-errors';
import { BadRequestError, InternalError } from '@lawprotect/shared-ts';

describe('EmailService', () => {
  let service: EmailService;
  let mockSesClient: {
    send: jest.MockedFunction<(command: SendEmailCommand) => Promise<SendEmailCommandOutput>>;
  } & Partial<SESClient>;
  const defaultFromEmail = 'noreply@example.com';
  const defaultReplyToEmail = 'support@example.com';
  const defaultConfigurationSet = 'default-config-set';

  beforeEach(() => {
    jest.clearAllMocks();

    const mockSend = jest.fn<(command: SendEmailCommand) => Promise<SendEmailCommandOutput>>();
    mockSesClient = {
      send: mockSend,
    } as any;

    service = new EmailService(
      mockSesClient as SESClient,
      defaultFromEmail,
      defaultReplyToEmail,
      defaultConfigurationSet
    );
  });

  describe('constructor', () => {
    it('should initialize with all parameters', () => {
      const testService = new EmailService(
        mockSesClient as SESClient,
        defaultFromEmail,
        defaultReplyToEmail,
        defaultConfigurationSet
      );

      expect(testService).toBeInstanceOf(EmailService);
    });

    it('should initialize without configuration set', () => {
      const testService = new EmailService(
        mockSesClient as SESClient,
        defaultFromEmail,
        defaultReplyToEmail
      );

      expect(testService).toBeInstanceOf(EmailService);
    });
  });

  describe('sendEmail', () => {
    it('should send email successfully', async () => {
      const request: SendEmailRequest = {
        to: 'recipient@example.com',
        subject: 'Test Subject',
        body: 'Test Body',
      };

      const mockResponse: SendEmailCommandOutput = {
        MessageId: 'msg-123',
        $metadata: {},
      };

      mockSesClient.send.mockResolvedValue(mockResponse);

      const result = await service.sendEmail(request);

      expect(result.messageId).toBe('msg-123');
      expect(result.recipient).toBe('recipient@example.com');
      expect(result.sentAt).toBeInstanceOf(Date);
      expect(mockSesClient.send).toHaveBeenCalledTimes(1);
    });

    it('should send email with HTML body', async () => {
      const request: SendEmailRequest = {
        to: 'recipient@example.com',
        subject: 'Test Subject',
        body: 'Test Body',
        htmlBody: '<html><body>Test HTML Body</body></html>',
      };

      const mockResponse: SendEmailCommandOutput = {
        MessageId: 'msg-456',
        $metadata: {},
      };

      mockSesClient.send.mockResolvedValue(mockResponse);

      const result = await service.sendEmail(request);

      expect(result.messageId).toBe('msg-456');
      const sentCommand = mockSesClient.send.mock.calls[0][0] as SendEmailCommand;
      expect(sentCommand.input.Message?.Body?.Html).toBeDefined();
      expect(sentCommand.input.Message?.Body?.Html?.Data).toBe('<html><body>Test HTML Body</body></html>');
    });

    it('should send email with custom from address', async () => {
      const request: SendEmailRequest = {
        to: 'recipient@example.com',
        subject: 'Test Subject',
        body: 'Test Body',
        from: 'custom@example.com',
      };

      const mockResponse: SendEmailCommandOutput = {
        MessageId: 'msg-789',
        $metadata: {},
      };

      mockSesClient.send.mockResolvedValue(mockResponse);

      await service.sendEmail(request);

      const sentCommand = mockSesClient.send.mock.calls[0][0] as SendEmailCommand;
      expect(sentCommand.input.Source).toBe('custom@example.com');
    });

    it('should use default from address when not specified', async () => {
      const request: SendEmailRequest = {
        to: 'recipient@example.com',
        subject: 'Test Subject',
        body: 'Test Body',
      };

      const mockResponse: SendEmailCommandOutput = {
        MessageId: 'msg-123',
        $metadata: {},
      };

      mockSesClient.send.mockResolvedValue(mockResponse);

      await service.sendEmail(request);

      const sentCommand = mockSesClient.send.mock.calls[0][0] as SendEmailCommand;
      expect(sentCommand.input.Source).toBe(defaultFromEmail);
    });

    it('should send email with reply-to address', async () => {
      const request: SendEmailRequest = {
        to: 'recipient@example.com',
        subject: 'Test Subject',
        body: 'Test Body',
        replyTo: 'custom-reply@example.com',
      };

      const mockResponse: SendEmailCommandOutput = {
        MessageId: 'msg-123',
        $metadata: {},
      };

      mockSesClient.send.mockResolvedValue(mockResponse);

      await service.sendEmail(request);

      const sentCommand = mockSesClient.send.mock.calls[0][0] as SendEmailCommand;
      expect(sentCommand.input.ReplyToAddresses).toContain('custom-reply@example.com');
    });

    it('should use default reply-to when not specified', async () => {
      const request: SendEmailRequest = {
        to: 'recipient@example.com',
        subject: 'Test Subject',
        body: 'Test Body',
      };

      const mockResponse: SendEmailCommandOutput = {
        MessageId: 'msg-123',
        $metadata: {},
      };

      mockSesClient.send.mockResolvedValue(mockResponse);

      await service.sendEmail(request);

      const sentCommand = mockSesClient.send.mock.calls[0][0] as SendEmailCommand;
      expect(sentCommand.input.ReplyToAddresses).toContain(defaultReplyToEmail);
    });

    it('should send email with CC addresses', async () => {
      const request: SendEmailRequest = {
        to: 'recipient@example.com',
        subject: 'Test Subject',
        body: 'Test Body',
        cc: 'cc@example.com',
      };

      const mockResponse: SendEmailCommandOutput = {
        MessageId: 'msg-123',
        $metadata: {},
      };

      mockSesClient.send.mockResolvedValue(mockResponse);

      await service.sendEmail(request);

      const sentCommand = mockSesClient.send.mock.calls[0][0] as SendEmailCommand;
      expect(sentCommand.input.Destination?.CcAddresses).toContain('cc@example.com');
    });

    it('should send email with BCC addresses', async () => {
      const request: SendEmailRequest = {
        to: 'recipient@example.com',
        subject: 'Test Subject',
        body: 'Test Body',
        bcc: ['bcc1@example.com', 'bcc2@example.com'],
      };

      const mockResponse: SendEmailCommandOutput = {
        MessageId: 'msg-123',
        $metadata: {},
      };

      mockSesClient.send.mockResolvedValue(mockResponse);

      await service.sendEmail(request);

      const sentCommand = mockSesClient.send.mock.calls[0][0] as SendEmailCommand;
      expect(sentCommand.input.Destination?.BccAddresses).toContain('bcc1@example.com');
      expect(sentCommand.input.Destination?.BccAddresses).toContain('bcc2@example.com');
    });

    it('should send email with multiple recipients', async () => {
      const request: SendEmailRequest = {
        to: ['recipient1@example.com', 'recipient2@example.com'],
        subject: 'Test Subject',
        body: 'Test Body',
      };

      const mockResponse: SendEmailCommandOutput = {
        MessageId: 'msg-123',
        $metadata: {},
      };

      mockSesClient.send.mockResolvedValue(mockResponse);

      await service.sendEmail(request);

      const sentCommand = mockSesClient.send.mock.calls[0][0] as SendEmailCommand;
      expect(sentCommand.input.Destination?.ToAddresses).toHaveLength(2);
      expect(sentCommand.input.Destination?.ToAddresses).toContain('recipient1@example.com');
      expect(sentCommand.input.Destination?.ToAddresses).toContain('recipient2@example.com');
    });

    it('should send email with configuration set', async () => {
      const request: SendEmailRequest = {
        to: 'recipient@example.com',
        subject: 'Test Subject',
        body: 'Test Body',
        configurationSet: 'custom-config-set',
      };

      const mockResponse: SendEmailCommandOutput = {
        MessageId: 'msg-123',
        $metadata: {},
      };

      mockSesClient.send.mockResolvedValue(mockResponse);

      await service.sendEmail(request);

      const sentCommand = mockSesClient.send.mock.calls[0][0] as SendEmailCommand;
      expect(sentCommand.input.ConfigurationSetName).toBe('custom-config-set');
    });

    it('should use default configuration set when not specified', async () => {
      const request: SendEmailRequest = {
        to: 'recipient@example.com',
        subject: 'Test Subject',
        body: 'Test Body',
      };

      const mockResponse: SendEmailCommandOutput = {
        MessageId: 'msg-123',
        $metadata: {},
      };

      mockSesClient.send.mockResolvedValue(mockResponse);

      await service.sendEmail(request);

      const sentCommand = mockSesClient.send.mock.calls[0][0] as SendEmailCommand;
      expect(sentCommand.input.ConfigurationSetName).toBe(defaultConfigurationSet);
    });

    it('should throw error when SES does not return MessageId', async () => {
      const request: SendEmailRequest = {
        to: 'recipient@example.com',
        subject: 'Test Subject',
        body: 'Test Body',
      };

      mockSesClient.send.mockResolvedValue({ $metadata: {} } as SendEmailCommandOutput);

      await expect(service.sendEmail(request)).rejects.toThrow();
    });

    it('should throw error for invalid email recipient', async () => {
      const request: SendEmailRequest = {
        to: 'invalid-email',
        subject: 'Test Subject',
        body: 'Test Body',
      };

      await expect(service.sendEmail(request)).rejects.toThrow();
    });

    it('should handle SES InvalidParameter error', async () => {
      const request: SendEmailRequest = {
        to: 'recipient@example.com',
        subject: 'Test Subject',
        body: 'Test Body',
      };

      const error = new Error('InvalidParameter: Invalid email');
      mockSesClient.send.mockRejectedValue(error);

      await expect(service.sendEmail(request)).rejects.toThrow(InternalError);
    });

    it('should handle SES MessageRejected error', async () => {
      const request: SendEmailRequest = {
        to: 'recipient@example.com',
        subject: 'Test Subject',
        body: 'Test Body',
      };

      const error = new Error('MessageRejected: Message was rejected');
      mockSesClient.send.mockRejectedValue(error);

      await expect(service.sendEmail(request)).rejects.toThrow(InternalError);
    });

    it('should handle MailFromDomainNotVerified error', async () => {
      const request: SendEmailRequest = {
        to: 'recipient@example.com',
        subject: 'Test Subject',
        body: 'Test Body',
      };

      const error = new Error('MailFromDomainNotVerified: Domain not verified');
      mockSesClient.send.mockRejectedValue(error);

      await expect(service.sendEmail(request)).rejects.toThrow(InternalError);
    });

    it('should handle AccountSendingPausedException error', async () => {
      const request: SendEmailRequest = {
        to: 'recipient@example.com',
        subject: 'Test Subject',
        body: 'Test Body',
      };

      const error = new Error('AccountSendingPausedException: Account paused');
      mockSesClient.send.mockRejectedValue(error);

      await expect(service.sendEmail(request)).rejects.toThrow(InternalError);
    });

    it('should propagate BadRequestError', async () => {
      const request: SendEmailRequest = {
        to: 'recipient@example.com',
        subject: 'Test Subject',
        body: 'Test Body',
      };

      const badRequestError = new BadRequestError('Validation failed');
      mockSesClient.send.mockRejectedValue(badRequestError);

      await expect(service.sendEmail(request)).rejects.toThrow(BadRequestError);
    });

    it('should handle generic AWS errors', async () => {
      const request: SendEmailRequest = {
        to: 'recipient@example.com',
        subject: 'Test Subject',
        body: 'Test Body',
      };

      const error = new Error('AWS SDK Error');
      mockSesClient.send.mockRejectedValue(error);

      await expect(service.sendEmail(request)).rejects.toThrow();
    });
  });

  describe('sendBulkEmail', () => {
    it('should send bulk emails successfully', async () => {
      const requests: SendEmailRequest[] = [
        {
          to: 'recipient1@example.com',
          subject: 'Test Subject 1',
          body: 'Test Body 1',
        },
        {
          to: 'recipient2@example.com',
          subject: 'Test Subject 2',
          body: 'Test Body 2',
        },
      ];

      mockSesClient.send
        .mockResolvedValueOnce({ MessageId: 'msg-1', $metadata: {} } as SendEmailCommandOutput)
        .mockResolvedValueOnce({ MessageId: 'msg-2', $metadata: {} } as SendEmailCommandOutput);

      const results = await service.sendBulkEmail(requests);

      expect(results).toHaveLength(2);
      expect(results[0].messageId).toBe('msg-1');
      expect(results[1].messageId).toBe('msg-2');
      expect(mockSesClient.send).toHaveBeenCalledTimes(2);
    });

    it('should handle partial failures in bulk send', async () => {
      const requests: SendEmailRequest[] = [
        {
          to: 'recipient1@example.com',
          subject: 'Test Subject 1',
          body: 'Test Body 1',
        },
        {
          to: 'invalid-email',
          subject: 'Test Subject 2',
          body: 'Test Body 2',
        },
      ];

      mockSesClient.send
        .mockResolvedValueOnce({ MessageId: 'msg-1', $metadata: {} } as SendEmailCommandOutput)
        .mockRejectedValueOnce(new Error('Invalid email'));

      const results = await service.sendBulkEmail(requests);

      expect(results).toHaveLength(2);
      expect(results[0].messageId).toBe('msg-1');
      expect(results[1].messageId).toContain('failed-');
      expect(results[1].recipient).toBe('invalid-email');
    });

    it('should throw error for empty array', async () => {
      await expect(service.sendBulkEmail([])).rejects.toThrow();
    });
  });

  describe('normalizeAddressList', () => {
    it('should normalize string to array', async () => {
      const request: SendEmailRequest = {
        to: 'recipient@example.com',
        subject: 'Test Subject',
        body: 'Test Body',
        cc: 'cc@example.com',
      };

      const mockResponse: SendEmailCommandOutput = {
        MessageId: 'msg-123',
        $metadata: {},
      };

      mockSesClient.send.mockResolvedValue(mockResponse);

      await service.sendEmail(request);

      const sentCommand = mockSesClient.send.mock.calls[0][0] as SendEmailCommand;
      expect(sentCommand.input.Destination?.CcAddresses).toEqual(['cc@example.com']);
    });

    it('should return undefined for undefined addresses', async () => {
      const request: SendEmailRequest = {
        to: 'recipient@example.com',
        subject: 'Test Subject',
        body: 'Test Body',
      };

      const mockResponse: SendEmailCommandOutput = {
        MessageId: 'msg-123',
        $metadata: {},
      };

      mockSesClient.send.mockResolvedValue(mockResponse);

      await service.sendEmail(request);

      const sentCommand = mockSesClient.send.mock.calls[0][0] as SendEmailCommand;
      expect(sentCommand.input.Destination?.CcAddresses).toBeUndefined();
      expect(sentCommand.input.Destination?.BccAddresses).toBeUndefined();
    });
  });
});

