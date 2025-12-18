/**
 * @fileoverview CognitoEventMapper.test.ts - Unit tests for CognitoEventMapper
 * @summary Tests for Cognito event mapping functions
 * @description Tests the mapping functions that transform Cognito trigger events
 * into CognitoEventData value objects.
 */

import { describe, it, expect } from '@jest/globals';
import {
  mapPreAuthEvent,
  mapPostAuthEvent,
  mapPostConfirmationEvent,
  mapPreTokenGenEvent
} from '../../../../src/triggers/mappers/CognitoEventMapper';
import {
  PreAuthEventBuilder,
  PostAuthEventBuilder,
  PostConfirmationEventBuilder,
  PreTokenGenEventBuilder
} from '../../../helpers/builders';

describe('CognitoEventMapper', () => {
  describe('mapPreAuthEvent', () => {
    it('should map PreAuthEvent to CognitoEventData correctly', () => {
      const event = new PreAuthEventBuilder()
        .withUserName('test-cognito-sub-123')
        .withUserAttributes({
          email: 'test@example.com',
          given_name: 'John',
          family_name: 'Doe',
          phone_number: '+1234567890'
        })
        .withRequestId('test-request-id')
        .build();

      const result = mapPreAuthEvent(event);

      expect(result.cognitoSub).toBe('test-cognito-sub-123');
      expect(result.email).toBe('test@example.com');
      expect(result.givenName).toBe('John');
      expect(result.familyName).toBe('Doe');
      expect(result.phoneNumber).toBe('+1234567890');
      expect(result.requestId).toBe('test-request-id');
      expect(result.userAttributes).toEqual(event.request.userAttributes);
    });

    it('should handle missing optional fields', () => {
      const event = new PreAuthEventBuilder()
        .withUserName('test-sub')
        .withUserAttributes({
          email: 'test@example.com'
        })
        .build();

      const result = mapPreAuthEvent(event);

      expect(result.cognitoSub).toBe('test-sub');
      expect(result.email).toBe('test@example.com');
      expect(result.givenName).toBeUndefined();
      expect(result.familyName).toBeUndefined();
      expect(result.phoneNumber).toBeUndefined();
    });

    it('should include clientMetadata when present', () => {
      const event = new PreAuthEventBuilder()
        .withUserName('test-sub')
        .build();
      event.request.clientMetadata = { source: 'test' };

      const result = mapPreAuthEvent(event);

      expect(result.clientMetadata).toEqual({ source: 'test' });
    });
  });

  describe('mapPostAuthEvent', () => {
    it('should map PostAuthEvent to CognitoEventData correctly', () => {
      const event = new PostAuthEventBuilder()
        .withUserName('test-cognito-sub-123')
        .withUserAttributes({
          email: 'test@example.com',
          given_name: 'John',
          family_name: 'Doe',
          phone_number: '+1234567890',
          locale: 'es'
        })
        .build();
      event.requestContext = { awsRequestId: 'test-request-id' };

      const result = mapPostAuthEvent(event);

      expect(result.cognitoSub).toBe('test-cognito-sub-123');
      expect(result.email).toBe('test@example.com');
      expect(result.givenName).toBe('John');
      expect(result.familyName).toBe('Doe');
      expect(result.phoneNumber).toBe('+1234567890');
      expect(result.locale).toBe('es');
      expect(result.requestId).toBe('test-request-id');
    });

    it('should handle missing optional fields', () => {
      const event = new PostAuthEventBuilder()
        .withUserName('test-sub')
        .withUserAttributes({
          email: 'test@example.com'
        })
        .build();

      const result = mapPostAuthEvent(event);

      expect(result.cognitoSub).toBe('test-sub');
      expect(result.email).toBe('test@example.com');
      expect(result.givenName).toBeUndefined();
      expect(result.familyName).toBeUndefined();
    });
  });

  describe('mapPostConfirmationEvent', () => {
    it('should map PostConfirmationEvent to CognitoEventData correctly', () => {
      const event = new PostConfirmationEventBuilder()
        .withUserName('test-cognito-sub-123')
        .withUserAttributes({
          email: 'test@example.com',
          given_name: 'John',
          family_name: 'Doe',
          phone_number: '+1234567890',
          locale: 'en'
        })
        .build();
      event.request.clientMetadata = { source: 'test' };
      event.requestContext = { awsRequestId: 'test-request-id' };

      const result = mapPostConfirmationEvent(event);

      expect(result.cognitoSub).toBe('test-cognito-sub-123');
      expect(result.email).toBe('test@example.com');
      expect(result.givenName).toBe('John');
      expect(result.familyName).toBe('Doe');
      expect(result.phoneNumber).toBe('+1234567890');
      expect(result.locale).toBe('en');
      expect(result.clientMetadata).toEqual({ source: 'test' });
      expect(result.requestId).toBe('test-request-id');
    });

    it('should handle missing optional fields', () => {
      const event = new PostConfirmationEventBuilder()
        .withUserName('test-sub')
        .withUserAttributes({
          email: 'test@example.com'
        })
        .build();

      const result = mapPostConfirmationEvent(event);

      expect(result.cognitoSub).toBe('test-sub');
      expect(result.email).toBe('test@example.com');
      expect(result.givenName).toBeUndefined();
      expect(result.familyName).toBeUndefined();
    });
  });

  describe('mapPreTokenGenEvent', () => {
    it('should map PreTokenGenEvent to CognitoEventData correctly', () => {
      const event = new PreTokenGenEventBuilder()
        .withUserName('test-cognito-sub-123')
        .withUserAttributes({
          email: 'test@example.com',
          given_name: 'John',
          family_name: 'Doe',
          locale: 'en'
        })
        .build();
      event.request.clientMetadata = { source: 'test' };
      event.requestContext = { awsRequestId: 'test-request-id' };

      const result = mapPreTokenGenEvent(event);

      expect(result.cognitoSub).toBe('test-cognito-sub-123');
      expect(result.email).toBe('test@example.com');
      expect(result.givenName).toBe('John');
      expect(result.familyName).toBe('Doe');
      expect(result.locale).toBe('en');
      expect(result.clientMetadata).toEqual({ source: 'test' });
      expect(result.requestId).toBe('test-request-id');
    });

    it('should handle missing optional fields', () => {
      const event = new PreTokenGenEventBuilder()
        .withUserName('test-sub')
        .withUserAttributes({
          email: 'test@example.com'
        })
        .build();

      const result = mapPreTokenGenEvent(event);

      expect(result.cognitoSub).toBe('test-sub');
      expect(result.email).toBe('test@example.com');
      expect(result.givenName).toBeUndefined();
      expect(result.familyName).toBeUndefined();
    });
  });
});

