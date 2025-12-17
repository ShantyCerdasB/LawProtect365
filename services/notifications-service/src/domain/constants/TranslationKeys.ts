/**
 * @fileoverview TranslationKeys - Translation key constants for notification messages
 * @summary Centralized translation keys to avoid hardcoded strings
 * @description Provides type-safe translation keys for all notification types
 * to ensure consistency and enable compile-time checking.
 */

/**
 * Translation keys for notification messages
 * 
 * Organized by service and event type to match the translation file structure.
 */
export const TranslationKeys = {
  envelopeInvitation: {
    subject: 'notifications.envelope_invitation.subject',
    body: 'notifications.envelope_invitation.body'
  },
  documentViewInvitation: {
    subject: 'notifications.document_view_invitation.subject',
    body: 'notifications.document_view_invitation.body'
  },
  signerDeclined: {
    subject: 'notifications.signer_declined.subject',
    body: 'notifications.signer_declined.body'
  },
  envelopeCancelled: {
    subject: 'notifications.envelope_cancelled.subject',
    body: 'notifications.envelope_cancelled.body'
  },
  reminderNotification: {
    subject: 'notifications.reminder_notification.subject',
    body: 'notifications.reminder_notification.body'
  },
  userRegistered: {
    subject: 'notifications.user_registered.subject',
    body: 'notifications.user_registered.body'
  },
  userUpdated: {
    subject: 'notifications.user_updated.subject',
    body: 'notifications.user_updated.body'
  },
  userRoleChanged: {
    subject: 'notifications.userrolechanged.subject',
    body: 'notifications.userrolechanged.body'
  },
  userStatusChanged: {
    subject: 'notifications.userstatuschanged.subject',
    body: 'notifications.userstatuschanged.body'
  },
  mfaStatusChanged: {
    subject: 'notifications.mfastatuschanged.subject',
    body: 'notifications.mfastatuschanged.body'
  },
  oauthAccountLinked: {
    subject: 'notifications.oauthaccountlinked.subject',
    body: 'notifications.oauthaccountlinked.body'
  },
  oauthAccountUnlinked: {
    subject: 'notifications.oauthaccountunlinked.subject',
    body: 'notifications.oauthaccountunlinked.body'
  }
} as const;

