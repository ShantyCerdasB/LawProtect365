/**
 * @fileoverview NotificationTemplates unit tests
 * @summary Tests for NotificationTemplates value object
 * @description Comprehensive unit tests for NotificationTemplates class methods
 */

import { NotificationTemplates } from '../../../../src/domain/value-objects/NotificationTemplates';
import { NotificationDefaults } from '../../../../src/domain/enums/NotificationDefaults';

describe('NotificationTemplates', () => {
  describe('defaultInviteMessage', () => {
    it('should return the default invite message from NotificationDefaults', () => {
      const result = NotificationTemplates.defaultInviteMessage();
      
      expect(result).toBe(NotificationDefaults.INVITE_MESSAGE);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return a consistent message across multiple calls', () => {
      const message1 = NotificationTemplates.defaultInviteMessage();
      const message2 = NotificationTemplates.defaultInviteMessage();
      
      expect(message1).toBe(message2);
    });
  });

  describe('defaultViewerMessage', () => {
    it('should return the default viewer message from NotificationDefaults', () => {
      const result = NotificationTemplates.defaultViewerMessage();
      
      expect(result).toBe(NotificationDefaults.VIEWER_MESSAGE);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return a consistent message across multiple calls', () => {
      const message1 = NotificationTemplates.defaultViewerMessage();
      const message2 = NotificationTemplates.defaultViewerMessage();
      
      expect(message1).toBe(message2);
    });
  });

  describe('defaultReminderMessage', () => {
    it('should return the default reminder message from NotificationDefaults', () => {
      const result = NotificationTemplates.defaultReminderMessage();
      
      expect(result).toBe(NotificationDefaults.REMINDER_MESSAGE);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return a consistent message across multiple calls', () => {
      const message1 = NotificationTemplates.defaultReminderMessage();
      const message2 = NotificationTemplates.defaultReminderMessage();
      
      expect(message1).toBe(message2);
    });
  });

  describe('message consistency', () => {
    it('should return different messages for different types', () => {
      const inviteMessage = NotificationTemplates.defaultInviteMessage();
      const viewerMessage = NotificationTemplates.defaultViewerMessage();
      const reminderMessage = NotificationTemplates.defaultReminderMessage();
      
      expect(inviteMessage).not.toBe(viewerMessage);
      expect(inviteMessage).not.toBe(reminderMessage);
      expect(viewerMessage).not.toBe(reminderMessage);
    });

    it('should return non-empty messages for all types', () => {
      const messages = [
        NotificationTemplates.defaultInviteMessage(),
        NotificationTemplates.defaultViewerMessage(),
        NotificationTemplates.defaultReminderMessage()
      ];
      
      messages.forEach(message => {
        expect(message).toBeDefined();
        expect(message).not.toBe('');
        expect(message.trim().length).toBeGreaterThan(0);
      });
    });
  });
});

