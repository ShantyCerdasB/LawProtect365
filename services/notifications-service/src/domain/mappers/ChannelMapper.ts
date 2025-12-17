/**
 * @fileoverview ChannelMapper - Mapper for notification channel conversions
 * @summary Converts NotificationChannel enum to result keys and vice versa
 * @description Provides mapping utilities for converting between NotificationChannel
 * enum values and string keys used in result objects, ensuring type safety and consistency.
 */

import { NotificationChannel } from '@prisma/client';

/**
 * Channel key type for result objects
 */
export type ChannelKey = 'email' | 'sms' | 'push';

/**
 * Maps NotificationChannel enum to result key
 * @param {NotificationChannel} channel - Notification channel enum
 * @returns {ChannelKey} Channel key for result objects
 */
export function channelToKey(channel: NotificationChannel): ChannelKey {
  switch (channel) {
    case NotificationChannel.EMAIL:
      return 'email';
    case NotificationChannel.SMS:
      return 'sms';
    case NotificationChannel.PUSH:
      return 'push';
    default:
      return 'email';
  }
}

/**
 * Maps channel key to NotificationChannel enum
 * @param {string} key - Channel key
 * @returns {NotificationChannel | null} NotificationChannel enum or null if invalid
 */
export function keyToChannel(key: string): NotificationChannel | null {
  switch (key) {
    case 'email':
      return NotificationChannel.EMAIL;
    case 'sms':
      return NotificationChannel.SMS;
    case 'push':
      return NotificationChannel.PUSH;
    default:
      return null;
  }
}

