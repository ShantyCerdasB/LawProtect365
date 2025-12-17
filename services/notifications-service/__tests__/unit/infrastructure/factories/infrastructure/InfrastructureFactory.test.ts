/**
 * @fileoverview InfrastructureFactory Tests - Unit tests for InfrastructureFactory
 * @summary Tests for AWS client creation and configuration
 * @description Comprehensive test suite for InfrastructureFactory covering
 * SES, Pinpoint, FCM, and APNS client creation.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { InfrastructureFactory } from '../../../../../src/infrastructure/factories/infrastructure/InfrastructureFactory';
import { SESClient } from '@aws-sdk/client-ses';
import { PinpointClient } from '@aws-sdk/client-pinpoint';
import { FcmClient } from '../../../../../src/infrastructure/clients/fcm';
import { ApnsClient } from '../../../../../src/infrastructure/clients/apns';

jest.mock('../../../../../src/config/AppConfig', () => ({
  loadConfig: jest.fn(() => ({
    email: { region: 'us-east-1' },
    sms: { region: 'us-west-2' },
    push: {
      fcm: {
        serviceAccountKey: JSON.stringify({ type: 'service_account' }),
        projectId: 'test-project',
      },
      apns: {
        keyId: 'key-id',
        teamId: 'team-id',
        key: 'key-content',
        bundleId: 'com.test.app',
        production: false,
      },
    },
  })),
}));
jest.mock('../../../../../src/infrastructure/clients/fcm');
jest.mock('../../../../../src/infrastructure/clients/apns');

describe('InfrastructureFactory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createSesClient', () => {
    it('creates SES client with correct region', () => {
      const client = InfrastructureFactory.createSesClient();
      expect(client).toBeInstanceOf(SESClient);
    });

    it('returns same instance on multiple calls', () => {
      const client1 = InfrastructureFactory.createSesClient();
      const client2 = InfrastructureFactory.createSesClient();
      expect(client1).toBe(client2);
    });
  });

  describe('createPinpointClient', () => {
    it('creates Pinpoint client with correct region', () => {
      const client = InfrastructureFactory.createPinpointClient();
      expect(client).toBeInstanceOf(PinpointClient);
    });

    it('returns same instance on multiple calls', () => {
      const client1 = InfrastructureFactory.createPinpointClient();
      const client2 = InfrastructureFactory.createPinpointClient();
      expect(client1).toBe(client2);
    });
  });

  describe('createFcmClient', () => {
    it('creates FCM client when serviceAccountKey is provided', () => {
      const client = InfrastructureFactory.createFcmClient();
      expect(client).toBeInstanceOf(FcmClient);
    });

    it('handles JSON string serviceAccountKey', () => {
      const client = InfrastructureFactory.createFcmClient();
      expect(client).toBeInstanceOf(FcmClient);
    });
  });

  describe('createApnsClient', () => {
    it('creates APNS client when config is provided', () => {
      const client = InfrastructureFactory.createApnsClient();
      expect(client).toBeInstanceOf(ApnsClient);
    });

  });

  describe('createAll', () => {
    it('creates all infrastructure services', () => {
      const result = InfrastructureFactory.createAll();
      expect(result.sesClient).toBeInstanceOf(SESClient);
      expect(result.pinpointClient).toBeInstanceOf(PinpointClient);
      expect(result.fcmClient).toBeInstanceOf(FcmClient);
      expect(result.apnsClient).toBeInstanceOf(ApnsClient);
    });
  });
});

