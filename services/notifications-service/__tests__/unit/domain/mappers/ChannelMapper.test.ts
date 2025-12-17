/**
 * @fileoverview ChannelMapper Tests - Unit tests for ChannelMapper
 * @summary Tests for channel mapping utilities
 * @description Comprehensive test suite for ChannelMapper covering channel
 * enum to key conversion and vice versa.
 */

import { describe, it, expect } from '@jest/globals';
import { channelToKey, keyToChannel } from '../../../../src/domain/mappers/ChannelMapper';
import { NotificationChannel } from '@prisma/client';

describe('ChannelMapper', () => {
  describe('channelToKey', () => {
    it('maps EMAIL to email', () => {
      expect(channelToKey(NotificationChannel.EMAIL)).toBe('email');
    });

    it('maps SMS to sms', () => {
      expect(channelToKey(NotificationChannel.SMS)).toBe('sms');
    });

    it('maps PUSH to push', () => {
      expect(channelToKey(NotificationChannel.PUSH)).toBe('push');
    });

    it('returns email as default for unknown channel', () => {
      const unknownChannel = 'UNKNOWN' as NotificationChannel;
      expect(channelToKey(unknownChannel)).toBe('email');
    });
  });

  describe('keyToChannel', () => {
    it('maps email to EMAIL', () => {
      expect(keyToChannel('email')).toBe(NotificationChannel.EMAIL);
    });

    it('maps sms to SMS', () => {
      expect(keyToChannel('sms')).toBe(NotificationChannel.SMS);
    });

    it('maps push to PUSH', () => {
      expect(keyToChannel('push')).toBe(NotificationChannel.PUSH);
    });

    it('returns null for unknown key', () => {
      expect(keyToChannel('unknown')).toBeNull();
    });
  });
});

