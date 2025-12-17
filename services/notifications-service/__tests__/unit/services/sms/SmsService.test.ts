/**
 * @fileoverview SmsService Tests - Unit tests for SmsService
 * @summary Tests for SMS sending operations via Pinpoint
 * @description Comprehensive test suite for SmsService covering SMS sending, bulk operations,
 * validation, message building, and error handling.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { SmsService } from '../../../../src/services/sms/SmsService';
import { PinpointClient, SendMessagesCommand, type SendMessagesCommandOutput } from '@aws-sdk/client-pinpoint';
import type { SendSmsRequest } from '../../../../src/domain/types/sms';
import { smsSendFailed } from '../../../../src/notification-errors';
import { BadRequestError, InternalError, ServiceUnavailableError } from '@lawprotect/shared-ts';

describe('SmsService', () => {
  let service: SmsService;
  let mockPinpointClient: {
    send: jest.MockedFunction<(command: SendMessagesCommand) => Promise<SendMessagesCommandOutput>>;
  } & Partial<PinpointClient>;
  const applicationId = 'app-123';
  const defaultSenderId = 'SENDER123';

  beforeEach(() => {
    jest.clearAllMocks();

    const mockSend = jest.fn<(command: SendMessagesCommand) => Promise<SendMessagesCommandOutput>>();
    mockPinpointClient = {
      send: mockSend,
    } as any;

    service = new SmsService(mockPinpointClient as PinpointClient, applicationId, defaultSenderId);
  });

  describe('sendSms', () => {
    it('should send SMS successfully', async () => {
      const request: SendSmsRequest = {
        phoneNumber: '+15551234567',
        message: 'Test message',
      };

      const mockResponse: SendMessagesCommandOutput = {
        MessageResponse: {
          ApplicationId: applicationId,
          Result: {
            '+15551234567': {
              MessageId: 'msg-123',
              StatusCode: 200,
              DeliveryStatus: 'SUCCESSFUL',
            },
          },
        },
        $metadata: {},
      };

      mockPinpointClient.send.mockResolvedValue(mockResponse);

      const result = await service.sendSms(request);

      expect(result.messageId).toBe('msg-123');
      expect(result.phoneNumber).toBe('+15551234567');
      expect(mockPinpointClient.send).toHaveBeenCalledTimes(1);
    });

    it('should use custom sender ID when provided', async () => {
      const request: SendSmsRequest = {
        phoneNumber: '+15551234567',
        message: 'Test message',
        senderId: 'CUSTOM123',
      };

      const mockResponse: SendMessagesCommandOutput = {
        MessageResponse: {
          ApplicationId: applicationId,
          Result: {
            '+15551234567': {
              MessageId: 'msg-123',
              StatusCode: 200,
              DeliveryStatus: 'SUCCESSFUL',
            },
          },
        },
        $metadata: {},
      };

      mockPinpointClient.send.mockResolvedValue(mockResponse);

      await service.sendSms(request);

      const sentCommand = mockPinpointClient.send.mock.calls[0][0] as SendMessagesCommand;
      expect(sentCommand.input.MessageRequest?.MessageConfiguration?.SMSMessage?.OriginationNumber).toBe('CUSTOM123');
    });

    it('should use default sender ID when not provided', async () => {
      const request: SendSmsRequest = {
        phoneNumber: '+15551234567',
        message: 'Test message',
      };

      const mockResponse: SendMessagesCommandOutput = {
        MessageResponse: {
          ApplicationId: applicationId,
          Result: {
            '+15551234567': {
              MessageId: 'msg-123',
              StatusCode: 200,
              DeliveryStatus: 'SUCCESSFUL',
            },
          },
        },
        $metadata: {},
      };

      mockPinpointClient.send.mockResolvedValue(mockResponse);

      await service.sendSms(request);

      const sentCommand = mockPinpointClient.send.mock.calls[0][0] as SendMessagesCommand;
      expect(sentCommand.input.MessageRequest?.MessageConfiguration?.SMSMessage?.OriginationNumber).toBe(defaultSenderId);
    });

    it('should throw error when Pinpoint response is invalid', async () => {
      const request: SendSmsRequest = {
        phoneNumber: '+15551234567',
        message: 'Test message',
      };

      const mockResponse: SendMessagesCommandOutput = {
        MessageResponse: {
          ApplicationId: applicationId,
        },
        $metadata: {},
      };

      mockPinpointClient.send.mockResolvedValue(mockResponse);

      await expect(service.sendSms(request)).rejects.toThrow(ServiceUnavailableError);
    });

    it('should throw error when message ID is missing', async () => {
      const request: SendSmsRequest = {
        phoneNumber: '+15551234567',
        message: 'Test message',
      };

      const mockResponse: SendMessagesCommandOutput = {
        MessageResponse: {
          ApplicationId: applicationId,
          Result: {
            '+15551234567': {
              StatusCode: 200,
              DeliveryStatus: 'SUCCESSFUL',
            },
          },
        },
        $metadata: {},
      };

      mockPinpointClient.send.mockResolvedValue(mockResponse);

      await expect(service.sendSms(request)).rejects.toThrow(ServiceUnavailableError);
    });

    it('should throw error for invalid phone number', async () => {
      const request: SendSmsRequest = {
        phoneNumber: 'invalid',
        message: 'Test message',
      };

      await expect(service.sendSms(request)).rejects.toThrow();
    });

    it('should throw error for empty message', async () => {
      const request: SendSmsRequest = {
        phoneNumber: '+15551234567',
        message: '',
      };

      await expect(service.sendSms(request)).rejects.toThrow();
    });

    it('should handle Pinpoint InvalidParameter error', async () => {
      const request: SendSmsRequest = {
        phoneNumber: '+15551234567',
        message: 'Test message',
      };

      const error = new Error('InvalidParameter: Invalid phone number');
      mockPinpointClient.send.mockRejectedValue(error);

      await expect(service.sendSms(request)).rejects.toThrow(InternalError);
    });

    it('should handle Pinpoint NotFoundException error', async () => {
      const request: SendSmsRequest = {
        phoneNumber: '+15551234567',
        message: 'Test message',
      };

      const error = new Error('NotFoundException: Application not found');
      mockPinpointClient.send.mockRejectedValue(error);

      await expect(service.sendSms(request)).rejects.toThrow(InternalError);
    });

    it('should handle Pinpoint ForbiddenException error', async () => {
      const request: SendSmsRequest = {
        phoneNumber: '+15551234567',
        message: 'Test message',
      };

      const error = new Error('ForbiddenException: Permissions denied');
      mockPinpointClient.send.mockRejectedValue(error);

      await expect(service.sendSms(request)).rejects.toThrow(InternalError);
    });

    it('should handle Pinpoint TooManyRequestsException error', async () => {
      const request: SendSmsRequest = {
        phoneNumber: '+15551234567',
        message: 'Test message',
      };

      const error = new Error('TooManyRequestsException: Rate limit exceeded');
      mockPinpointClient.send.mockRejectedValue(error);

      await expect(service.sendSms(request)).rejects.toThrow(InternalError);
    });

    it('should propagate BadRequestError', async () => {
      const request: SendSmsRequest = {
        phoneNumber: '+15551234567',
        message: 'Test message',
      };

      const badRequestError = new BadRequestError('Validation failed');
      mockPinpointClient.send.mockRejectedValue(badRequestError);

      await expect(service.sendSms(request)).rejects.toThrow(BadRequestError);
    });
  });

  describe('sendBulkSms', () => {
    it('should send bulk SMS successfully', async () => {
      const requests: SendSmsRequest[] = [
        {
          phoneNumber: '+15551234567',
          message: 'Message 1',
        },
        {
          phoneNumber: '+15559876543',
          message: 'Message 2',
        },
      ];

      const mockResponse: SendMessagesCommandOutput = {
        MessageResponse: {
          ApplicationId: applicationId,
          Result: {
            '+15551234567': {
              MessageId: 'msg-1',
              StatusCode: 200,
              DeliveryStatus: 'SUCCESSFUL',
            },
            '+15559876543': {
              MessageId: 'msg-2',
              StatusCode: 200,
              DeliveryStatus: 'SUCCESSFUL',
            },
          },
        },
        $metadata: {},
      };

      mockPinpointClient.send.mockResolvedValue(mockResponse);

      const results = await service.sendBulkSms(requests);

      expect(results).toHaveLength(2);
      expect(results[0].messageId).toBe('msg-1');
      expect(results[1].messageId).toBe('msg-2');
      expect(mockPinpointClient.send).toHaveBeenCalledTimes(1);
    });

    it('should handle partial failures in bulk send', async () => {
      const requests: SendSmsRequest[] = [
        {
          phoneNumber: '+15551234567',
          message: 'Message 1',
        },
        {
          phoneNumber: '+15559876543',
          message: 'Message 2',
        },
      ];

      const mockResponse: SendMessagesCommandOutput = {
        MessageResponse: {
          ApplicationId: applicationId,
          Result: {
            '+15551234567': {
              MessageId: 'msg-1',
              StatusCode: 200,
              DeliveryStatus: 'SUCCESSFUL',
            },
            '+15559876543': {
              StatusCode: 400,
              DeliveryStatus: 'PERMANENT_FAILURE',
            },
          },
        },
        $metadata: {},
      };

      mockPinpointClient.send.mockResolvedValue(mockResponse);

      const results = await service.sendBulkSms(requests);

      expect(results).toHaveLength(2);
      expect(results[0].messageId).toBe('msg-1');
      expect(results[1].messageId).toContain('failed-');
    });

    it('should throw error for empty array', async () => {
      await expect(service.sendBulkSms([])).rejects.toThrow();
    });

    it('should throw error when bulk response is invalid', async () => {
      const requests: SendSmsRequest[] = [
        {
          phoneNumber: '+15551234567',
          message: 'Message 1',
        },
      ];

      const mockResponse: SendMessagesCommandOutput = {
        MessageResponse: {
          ApplicationId: applicationId,
        },
        $metadata: {},
      };

      mockPinpointClient.send.mockResolvedValue(mockResponse);

      await expect(service.sendBulkSms(requests)).rejects.toThrow(InternalError);
    });
  });
});

