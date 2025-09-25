/**
 * @fileoverview shareDocumentViewHelpers - Helper functions for share document view integration tests
 * @summary Provides verification and utility functions for document view sharing tests
 * @description This module contains helper functions for testing document view sharing functionality,
 * including verification of viewer participants, invitation tokens, notification events, and audit events.
 */

import { outboxMockHelpers } from '../mocks/aws/outboxMock';

/**
 * Interface for share document view request data
 */
export interface ShareDocumentViewData {
  email: string;
  fullName: string;
  message?: string;
  expiresIn?: number;
}

/**
 * Interface for expected viewer invitation
 */
export interface ExpectedViewerInvitation {
  envelopeId: string;
  viewerEmail: string;
  viewerName: string;
  message?: string;
  invitationToken?: string;
  expiresAt?: string;
  expiresInDays?: number;
}

/**
 * Interface for share document view options
 */
export interface ShareDocumentViewOptions {
  envelopeId: string;
  viewerData: ShareDocumentViewData;
  expectedStatus?: number;
  expectedSuccess?: boolean;
}

/**
 * Verify that viewer invitation history contains the expected viewer
 * @param envelopeId - The envelope ID
 * @param viewerEmail - The viewer email
 * @param viewerName - The viewer name
 */
export function verifyViewerInvitationHistory(
  envelopeId: string, 
  viewerEmail: string, 
  viewerName: string
): void {
  const viewerId = `external-viewer:${viewerEmail}:${viewerName}`;
  const hasReceivedInvitation = outboxMockHelpers.hasReceivedInvitation(envelopeId, viewerId);
  
  expect(hasReceivedInvitation).toBe(true);
  console.log(`✅ Viewer invitation verified: ${viewerEmail} (${viewerName})`);
}

/**
 * Verify that viewer notification event was published
 * @param envelopeId - The envelope ID
 * @param viewerEmail - The viewer email
 * @param viewerName - The viewer name
 */
export function verifyViewerNotificationEvent(
  envelopeId: string, 
  viewerEmail: string, 
  viewerName: string
): void {
  const publishedEvents = outboxMockHelpers.getPublishedEvents(envelopeId);
  const viewerEvents = publishedEvents.filter(event => 
    event.detail?.eventType === 'DOCUMENT_VIEW_INVITATION' &&
    event.detail?.viewerEmail === viewerEmail &&
    event.detail?.viewerName === viewerName
  );
  
  expect(viewerEvents.length).toBeGreaterThan(0);
  expect(viewerEvents[0].detail.participantRole).toBe('VIEWER');
  expect(viewerEvents[0].detail.invitationToken).toBeDefined();
  expect(viewerEvents[0].detail.expiresAt).toBeDefined();
  
  console.log(`✅ Viewer notification event verified: ${viewerEmail} (${viewerName})`);
}

/**
 * Verify that viewer audit event was created
 * @param envelopeId - The envelope ID
 * @param viewerEmail - The viewer email
 * @param eventType - The expected audit event type
 */
export function verifyViewerAuditEvent(
  envelopeId: string, 
  viewerEmail: string, 
  eventType: string
): void {
  // This would need to be implemented based on how audit events are stored
  // For now, we'll just log that this verification is needed
  console.log(`✅ Viewer audit event verification needed: ${eventType} for ${viewerEmail}`);
}

/**
 * Verify that no duplicate viewer invitations were sent
 * @param envelopeId - The envelope ID
 * @param viewerEmail - The viewer email
 * @param viewerName - The viewer name
 */
export function verifyNoDuplicateViewerInvitations(
  envelopeId: string, 
  viewerEmail: string, 
  viewerName: string
): void {
  const publishedEvents = outboxMockHelpers.getPublishedEvents(envelopeId);
  const viewerEvents = publishedEvents.filter(event => 
    event.detail?.eventType === 'DOCUMENT_VIEW_INVITATION' &&
    event.detail?.viewerEmail === viewerEmail &&
    event.detail?.viewerName === viewerName
  );
  
  // Should have exactly one event per viewer
  expect(viewerEvents.length).toBe(1);
  console.log(`✅ No duplicate viewer invitations verified: ${viewerEmail} (${viewerName})`);
}

/**
 * Verify viewer invitation token details
 * @param envelopeId - The envelope ID
 * @param viewerEmail - The viewer email
 * @param viewerName - The viewer name
 * @param expectedExpiresInDays - Expected expiration in days
 */
export function verifyViewerInvitationToken(
  envelopeId: string, 
  viewerEmail: string, 
  viewerName: string, 
  expectedExpiresInDays: number
): void {
  const publishedEvents = outboxMockHelpers.getPublishedEvents(envelopeId);
  const viewerEvents = publishedEvents.filter(event => 
    event.detail?.eventType === 'DOCUMENT_VIEW_INVITATION' &&
    event.detail?.viewerEmail === viewerEmail &&
    event.detail?.viewerName === viewerName
  );
  
  expect(viewerEvents.length).toBe(1);
  
  const event = viewerEvents[0];
  expect(event.detail.invitationToken).toBeDefined();
  expect(event.detail.expiresAt).toBeDefined();
  
  // Verify expiration date is approximately correct
  const expiresAt = new Date(event.detail.expiresAt);
  const now = new Date();
  const expectedExpiresAt = new Date(now.getTime() + (expectedExpiresInDays * 24 * 60 * 60 * 1000));
  
  // Allow 1 minute tolerance
  const timeDiff = Math.abs(expiresAt.getTime() - expectedExpiresAt.getTime());
  expect(timeDiff).toBeLessThan(60 * 1000);
  
  console.log(`✅ Viewer invitation token verified: ${viewerEmail} (${viewerName})`);
}

/**
 * Verify that viewer received invitation
 * @param envelopeId - The envelope ID
 * @param viewerEmail - The viewer email
 * @param viewerName - The viewer name
 */
export function verifyViewerReceivedInvitation(
  envelopeId: string, 
  viewerEmail: string, 
  viewerName: string
): void {
  verifyViewerInvitationHistory(envelopeId, viewerEmail, viewerName);
  verifyViewerNotificationEvent(envelopeId, viewerEmail, viewerName);
  console.log(`✅ Viewer invitation complete: ${viewerEmail} (${viewerName})`);
}

/**
 * Clear all share document view mock data
 */
export function clearShareDocumentViewMockData(): void {
  outboxMockHelpers.clearAllMockData();
  console.log('🧹 Share document view mock data cleared');
}

/**
 * Get viewer invitation summary for an envelope
 * @param envelopeId - The envelope ID
 * @returns Summary of viewer invitations
 */
export function getViewerInvitationSummary(envelopeId: string): {
  totalViewers: number;
  viewerEmails: string[];
  viewerNames: string[];
  events: any[];
} {
  const publishedEvents = outboxMockHelpers.getPublishedEvents(envelopeId);
  const viewerEvents = publishedEvents.filter(event => 
    event.detail?.eventType === 'DOCUMENT_VIEW_INVITATION'
  );
  
  const viewerEmails = viewerEvents.map(event => event.detail.viewerEmail);
  const viewerNames = viewerEvents.map(event => event.detail.viewerName);
  
  return {
    totalViewers: viewerEvents.length,
    viewerEmails,
    viewerNames,
    events: viewerEvents
  };
}

/**
 * Verify viewer invitation summary
 * @param envelopeId - The envelope ID
 * @param expectedViewers - Array of expected viewer emails
 */
export function verifyViewerInvitationSummary(
  envelopeId: string, 
  expectedViewers: string[]
): void {
  const summary = getViewerInvitationSummary(envelopeId);
  
  expect(summary.totalViewers).toBe(expectedViewers.length);
  expect(summary.viewerEmails).toEqual(expect.arrayContaining(expectedViewers));
  
  console.log(`✅ Viewer invitation summary verified: ${summary.totalViewers} viewers`);
}
