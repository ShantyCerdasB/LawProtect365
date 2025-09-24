/**
 * @fileoverview declineSignerHelpers - Helper functions for decline signer workflow tests
 * @summary Provides verification and test utilities for decline signer operations
 * @description This module contains helper functions for testing decline signer workflows,
 * including database verification, audit event validation, and notification event tracking.
 */

import { PrismaClient } from '@prisma/client';

/**
 * Verifies that a signer has been declined in the database
 * @param envelopeId - The envelope ID
 * @param signerId - The signer ID that was declined
 * @param reason - The decline reason
 * @returns Promise that resolves when verification is complete
 */
export async function verifySignerDeclined(
  envelopeId: string,
  signerId: string,
  reason: string
): Promise<void> {
  const prisma = new PrismaClient();
  
  try {
    // Verify signer status is DECLINED
    const signer = await prisma.envelopeSigner.findFirst({
      where: {
        id: signerId,
        envelopeId: envelopeId
      }
    });

    expect(signer).toBeDefined();
    expect(signer?.status).toBe('DECLINED');
    expect(signer?.declineReason).toBe(reason);
    expect(signer?.declinedAt).toBeDefined();
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Verifies that a decline audit event was created
 * @param envelopeId - The envelope ID
 * @param signerId - The signer ID that was declined
 * @param reason - The decline reason
 * @returns Promise that resolves when verification is complete
 */
export async function verifyDeclineAuditEvent(
  envelopeId: string,
  signerId: string,
  reason: string
): Promise<void> {
  const prisma = new PrismaClient();
  
  try {
    // Verify audit event was created
    const auditEvent = await prisma.signatureAuditEvent.findFirst({
      where: {
        envelopeId: envelopeId,
        signerId: signerId,
        eventType: 'SIGNER_DECLINED'
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    expect(auditEvent).toBeDefined();
    expect(auditEvent?.eventType).toBe('SIGNER_DECLINED');
    expect(auditEvent?.description).toContain('declined');
    expect(auditEvent?.metadata).toBeDefined();
    
    const metadata = auditEvent?.metadata as any;
    expect(metadata?.declineReason).toBe(reason);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Verifies that a decline notification event was published
 * @param envelopeId - The envelope ID
 * @param signerId - The signer ID that was declined
 * @param reason - The decline reason
 * @returns Promise that resolves when verification is complete
 */
export async function verifyDeclineNotificationEvent(
  envelopeId: string,
  signerId: string,
  reason: string
): Promise<void> {
  // Access the outbox mock to verify notification event
  const outboxMockModule = require('../mocks/aws/outboxMock');
  const publishedEvents = outboxMockModule.publishedEvents || new Map();
  
  const envelopeEvents = publishedEvents.get(envelopeId) || [];
  const declineEvent = envelopeEvents.find((event: any) => 
    event.type === 'SIGNER_DECLINED' && 
    event.payload?.signerId === signerId
  );

  expect(declineEvent).toBeDefined();
  expect(declineEvent.type).toBe('SIGNER_DECLINED');
  expect(declineEvent.payload.envelopeId).toBe(envelopeId);
  expect(declineEvent.payload.signerId).toBe(signerId);
  expect(declineEvent.payload.declineReason).toBe(reason);
}

/**
 * Verifies envelope status after decline (should remain READY_FOR_SIGNATURE)
 * @param envelopeId - The envelope ID
 * @returns Promise that resolves when verification is complete
 */
export async function verifyEnvelopeStatusAfterDecline(envelopeId: string): Promise<void> {
  const prisma = new PrismaClient();
  
  try {
    const envelope = await prisma.signatureEnvelope.findUnique({
      where: { id: envelopeId }
    });

    expect(envelope).toBeDefined();
    expect(envelope?.status).toBe('DECLINED'); // Should be declined when any signer declines
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Gets comprehensive decline verification summary
 * @param envelopeId - The envelope ID
 * @returns Promise that resolves to decline verification summary
 */
export async function getDeclineVerificationSummary(envelopeId: string): Promise<{
  envelope: {
    id: string;
    status: string;
    progress: number;
  };
  signers: Array<{
    id: string;
    status: string;
    declinedReason?: string;
    declinedAt?: Date;
  }>;
  declineEvents: Array<{
    signerId: string;
    reason: string;
    declinedAt: Date;
  }>;
  auditEvents: Array<{
    eventType: string;
    description: string;
    createdAt: Date;
  }>;
}> {
  const prisma = new PrismaClient();
  
  try {
    // Get envelope
    const envelope = await prisma.signatureEnvelope.findUnique({
      where: { id: envelopeId },
      include: {
        signers: {
          orderBy: { order: 'asc' }
        }
      }
    });

    expect(envelope).toBeDefined();

    // Get decline audit events
    const declineAuditEvents = await prisma.signatureAuditEvent.findMany({
      where: {
        envelopeId: envelopeId,
        eventType: 'SIGNER_DECLINED'
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get decline notification events from mock
    const outboxMockModule = require('../mocks/aws/outboxMock');
    const publishedEvents = outboxMockModule.publishedEvents || new Map();
    const envelopeEvents = publishedEvents.get(envelopeId) || [];
    const declineNotificationEvents = envelopeEvents.filter((event: any) => 
      event.type === 'SIGNER_DECLINED'
    );

    return {
      envelope: {
        id: envelope!.id,
        status: envelope!.status,
        progress: Math.round(envelope!.signers.filter(s => s.status === 'SIGNED').length / envelope!.signers.length * 100)
      },
      signers: envelope!.signers.map(signer => ({
        id: signer.id,
        status: signer.status,
        declinedReason: signer.declineReason || undefined,
        declinedAt: signer.declinedAt || undefined
      })),
      declineEvents: declineNotificationEvents.map((event: any) => ({
        signerId: event.payload.signerId,
        reason: event.payload.declineReason,
        declinedAt: new Date(event.timestamp)
      })),
      auditEvents: declineAuditEvents.map(event => ({
        eventType: event.eventType,
        description: event.description,
        createdAt: event.createdAt,
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
        country: event.country,
        userId: event.userId,
        userEmail: event.userEmail
      }))
    };
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Clears decline mock data for test isolation
 */
export function clearDeclineMockData(): void {
  const outboxMockModule = require('../mocks/aws/outboxMock');
  const publishedEvents = outboxMockModule.publishedEvents || new Map();
  
  // Clear all decline events
  for (const [envelopeId, events] of publishedEvents.entries()) {
    const filteredEvents = events.filter((event: any) => event.type !== 'SIGNER_DECLINED');
    if (filteredEvents.length === 0) {
      publishedEvents.delete(envelopeId);
    } else {
      publishedEvents.set(envelopeId, filteredEvents);
    }
  }
}
