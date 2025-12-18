/**
 * @fileoverview ServiceFactory Tests - Unit tests for ServiceFactory
 * @summary Tests for service factory creation methods
 * @description Comprehensive test suite for ServiceFactory covering all service creation
 * methods including email, SMS, push, and the createAll method.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { ServiceFactory } from '../../../../../src/infrastructure/factories/services/ServiceFactory';
import { EmailService } from '../../../../../src/services/email';
import { SmsService } from '../../../../../src/services/sms';
import { PushNotificationService } from '../../../../../src/services/push';
import { InfrastructureFactory } from '../../../../../src/infrastructure/factories/infrastructure/InfrastructureFactory';

describe('ServiceFactory', () => {
  let mockInfrastructure: ReturnType<typeof InfrastructureFactory.createAll>;
  let mockSesClient: any;
  let mockPinpointClient: any;
  let mockFcmClient: any;
  let mockApnsClient: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSesClient = {
      sendEmail: jest.fn(),
    };

    mockPinpointClient = {
      sendMessages: jest.fn(),
    };

    mockFcmClient = {
      send: jest.fn(),
    };

    mockApnsClient = {
      send: jest.fn(),
    };

    mockInfrastructure = {
      sesClient: mockSesClient,
      pinpointClient: mockPinpointClient,
      fcmClient: mockFcmClient,
      apnsClient: mockApnsClient,
    } as any;
  });

  describe('createEmailService', () => {
    it('should create EmailService with correct dependencies', () => {
      const emailService = ServiceFactory.createEmailService(mockInfrastructure);

      expect(emailService).toBeInstanceOf(EmailService);
    });

    it('should use SES client from infrastructure', () => {
      const emailService = ServiceFactory.createEmailService(mockInfrastructure);

      expect(emailService).toBeInstanceOf(EmailService);
    });
  });

  describe('createSmsService', () => {
    it('should create SmsService with correct dependencies', () => {
      const smsService = ServiceFactory.createSmsService(mockInfrastructure);

      expect(smsService).toBeInstanceOf(SmsService);
    });

    it('should use Pinpoint client from infrastructure', () => {
      const smsService = ServiceFactory.createSmsService(mockInfrastructure);

      expect(smsService).toBeInstanceOf(SmsService);
    });
  });

  describe('createPushNotificationService', () => {
    it('should create PushNotificationService with correct dependencies', () => {
      const pushService = ServiceFactory.createPushNotificationService(mockInfrastructure);

      expect(pushService).toBeInstanceOf(PushNotificationService);
    });

    it('should use FCM and APNS clients from infrastructure', () => {
      const pushService = ServiceFactory.createPushNotificationService(mockInfrastructure);

      expect(pushService).toBeInstanceOf(PushNotificationService);
    });
  });

  describe('createAll', () => {
    it('should create all services', () => {
      const services = ServiceFactory.createAll(mockInfrastructure);

      expect(services).toHaveProperty('emailService');
      expect(services).toHaveProperty('smsService');
      expect(services).toHaveProperty('pushNotificationService');
      expect(services.emailService).toBeInstanceOf(EmailService);
      expect(services.smsService).toBeInstanceOf(SmsService);
      expect(services.pushNotificationService).toBeInstanceOf(PushNotificationService);
    });

    it('should create services with correct infrastructure dependencies', () => {
      const services = ServiceFactory.createAll(mockInfrastructure);

      expect(services.emailService).toBeInstanceOf(EmailService);
      expect(services.smsService).toBeInstanceOf(SmsService);
      expect(services.pushNotificationService).toBeInstanceOf(PushNotificationService);
    });
  });
});


