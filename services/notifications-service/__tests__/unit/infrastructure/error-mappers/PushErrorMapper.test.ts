/**
 * @fileoverview PushErrorMapper Tests - Unit tests for PushErrorMapper
 * @summary Tests for push notification error mapping
 * @description Comprehensive test suite for PushErrorMapper covering
 * FCM and APNS error mapping to domain errors.
 */

import { describe, it, expect } from '@jest/globals';
import { mapFcmError, mapApnsError, mapPushServiceError } from '../../../../src/infrastructure/error-mappers/PushErrorMapper';
import { BadRequestError, InternalError } from '@lawprotect/shared-ts';

describe('PushErrorMapper', () => {
  describe('mapFcmError', () => {
    it('propagates BadRequestError', () => {
      const error = new BadRequestError('Validation failed');
      expect(() => mapFcmError(error, 'token', 'context')).toThrow(BadRequestError);
    });

    it('maps invalid-registration-token to invalidRecipient', () => {
      const error = new Error('Invalid-registration-token');
      expect(() => mapFcmError(error, 'token', 'context')).toThrow(BadRequestError);
    });

    it('maps registration-token-not-registered to pushSendFailed', () => {
      const error = new Error('Registration-token-not-registered');
      expect(() => mapFcmError(error, 'token', 'context')).toThrow(InternalError);
    });

    it('maps authentication-error to pushSendFailed', () => {
      const error = new Error('Authentication-error');
      expect(() => mapFcmError(error, 'token', 'context')).toThrow(InternalError);
    });

    it('maps permission-denied to pushSendFailed', () => {
      const error = new Error('Permission-denied');
      expect(() => mapFcmError(error, 'token', 'context')).toThrow(InternalError);
    });

    it('maps invalid-argument to pushSendFailed', () => {
      const error = new Error('Invalid-argument: invalid message');
      expect(() => mapFcmError(error, 'token', 'context')).toThrow(InternalError);
    });

    it('maps unknown errors via mapAwsError', () => {
      const error = new Error('Unknown error');
      expect(() => mapFcmError(error, 'token', 'context')).toThrow(InternalError);
    });
  });

  describe('mapApnsError', () => {
    it('propagates BadRequestError', () => {
      const error = new BadRequestError('Validation failed');
      expect(() => mapApnsError(error, 'token', 'context')).toThrow(BadRequestError);
    });

    it('maps invalidtoken to invalidRecipient', () => {
      const error = new Error('InvalidToken');
      expect(() => mapApnsError(error, 'token', 'context')).toThrow(BadRequestError);
    });

    it('maps baddevicetoken to invalidRecipient', () => {
      const error = new Error('BadDeviceToken');
      expect(() => mapApnsError(error, 'token', 'context')).toThrow(BadRequestError);
    });

    it('maps unregistered to pushSendFailed', () => {
      const error = new Error('Unregistered');
      expect(() => mapApnsError(error, 'token', 'context')).toThrow(InternalError);
    });

    it('maps forbidden to pushSendFailed', () => {
      const error = new Error('Forbidden');
      expect(() => mapApnsError(error, 'token', 'context')).toThrow(InternalError);
    });

    it('maps unauthorized to pushSendFailed', () => {
      const error = new Error('Unauthorized');
      expect(() => mapApnsError(error, 'token', 'context')).toThrow(InternalError);
    });

    it('maps badtopic to pushSendFailed', () => {
      const error = new Error('BadTopic');
      expect(() => mapApnsError(error, 'token', 'context')).toThrow(InternalError);
    });

    it('maps topicdisallowed to pushSendFailed', () => {
      const error = new Error('TopicDisallowed');
      expect(() => mapApnsError(error, 'token', 'context')).toThrow(InternalError);
    });

    it('maps unknown errors via mapAwsError', () => {
      const error = new Error('Unknown error');
      expect(() => mapApnsError(error, 'token', 'context')).toThrow(InternalError);
    });
  });

  describe('mapPushServiceError', () => {
    it('propagates BadRequestError', () => {
      const error = new BadRequestError('Validation failed');
      expect(() => mapPushServiceError(error, 'operation', 'recipient')).toThrow(BadRequestError);
    });

    it('maps invalidparameter to pushSendFailed', () => {
      const error = new Error('InvalidParameter');
      expect(() => mapPushServiceError(error, 'operation', 'recipient')).toThrow(InternalError);
    });

    it('maps invalid device token to pushSendFailed', () => {
      const error = new Error('Invalid device token');
      expect(() => mapPushServiceError(error, 'operation', 'recipient')).toThrow(InternalError);
    });

    it('maps notfound to pushSendFailed', () => {
      const error = new Error('NotFound');
      expect(() => mapPushServiceError(error, 'operation', 'recipient')).toThrow(InternalError);
    });

    it('maps not found to pushSendFailed', () => {
      const error = new Error('Not found');
      expect(() => mapPushServiceError(error, 'operation', 'recipient')).toThrow(InternalError);
    });

    it('maps unauthorized to pushSendFailed', () => {
      const error = new Error('Unauthorized');
      expect(() => mapPushServiceError(error, 'operation', 'recipient')).toThrow(InternalError);
    });

    it('maps unknown errors via mapAwsError', () => {
      const error = new Error('Unknown error');
      expect(() => mapPushServiceError(error, 'operation', 'recipient')).toThrow(InternalError);
    });
  });
});

