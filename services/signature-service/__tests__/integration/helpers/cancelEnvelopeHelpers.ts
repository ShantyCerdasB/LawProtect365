/**
 * @fileoverview cancelEnvelopeHelpers - Helper functions for cancel envelope workflow tests
 * @summary Verification helpers for cancel envelope operations
 * @description Provides helper functions to verify the state of the database and published events
 * after an envelope is cancelled, including status verification, audit events, and notification events.
 */

import { PrismaClient } from '@prisma/client';

/**
 * Verifies that an envelope has been cancelled in the database
 * @param envelopeId - The envelope ID to verify
 */
export async function verifyEnvelopeCancelled(envelopeId: string) {
  const prisma = new PrismaClient();
  try {
    const envelope = await prisma.signatureEnvelope.findUnique({
      where: { id: envelopeId }
    });

    expect(envelope).toBeDefined();
    expect(envelope?.status).toBe('CANCELLED');
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Verifies that a cancellation audit event was created
 * @param envelopeId - The envelope ID
 * @param userId - The user ID who cancelled the envelope
 */
export async function verifyCancellationAuditEvent(envelopeId: string, userId: string) {
  const prisma = new PrismaClient();
  try {
    const auditEvent = await prisma.signatureAuditEvent.findFirst({
      where: {
        envelopeId: envelopeId,
        eventType: 'ENVELOPE_CANCELLED',
        userId: userId
      },
      orderBy: { createdAt: 'desc' }
    });

    expect(auditEvent).toBeDefined();
    expect(auditEvent?.eventType).toBe('ENVELOPE_CANCELLED');
    expect(auditEvent?.userId).toBe(userId);
    expect(auditEvent?.description).toContain('cancelled');
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Verifies that a cancellation notification event was published
 * @param envelopeId - The envelope ID
 * @param userId - The user ID who cancelled the envelope
 */
export async function verifyCancellationNotificationEvent(envelopeId: string, userId: string) {
  const outboxMockModule = require('../mocks/aws/outboxMock');
  const publishedEvents = outboxMockModule.publishedEvents || new Map();
  
  const envelopeEvents = publishedEvents.get(envelopeId) || [];
  const cancellationEvent = envelopeEvents.find((event: any) => 
    event.type === 'ENVELOPE_CANCELLED' && 
    event.payload.cancelledByUserId === userId
  );

  expect(cancellationEvent).toBeDefined();
  expect(cancellationEvent.type).toBe('ENVELOPE_CANCELLED');
  expect(cancellationEvent.payload.envelopeId).toBe(envelopeId);
  expect(cancellationEvent.payload.cancelledByUserId).toBe(userId);
}

/**
 * Gets a comprehensive summary of the cancellation verification
 * @param envelopeId - The envelope ID
 * @param userId - The user ID who cancelled the envelope
 * @returns Summary object with envelope and event information
 */
export async function getCancellationVerificationSummary(envelopeId: string, userId: string) {
  const prisma = new PrismaClient();
  try {
    const envelope = await prisma.signatureEnvelope.findUnique({
      where: { id: envelopeId },
      include: {
        signers: {
          orderBy: { order: 'asc' }
        }
      }
    });

    const auditEvent = await prisma.signatureAuditEvent.findFirst({
      where: {
        envelopeId: envelopeId,
        eventType: 'ENVELOPE_CANCELLED',
        userId: userId
      },
      orderBy: { createdAt: 'desc' }
    });

    const outboxMockModule = require('../mocks/aws/outboxMock');
    const publishedEvents = outboxMockModule.publishedEvents || new Map();
    const envelopeEvents = publishedEvents.get(envelopeId) || [];
    const cancellationEvent = envelopeEvents.find((event: any) => 
      event.type === 'ENVELOPE_CANCELLED' && 
      event.payload.cancelledByUserId === userId
    );

    return {
      envelope: {
        id: envelope?.id,
        status: envelope?.status,
        title: envelope?.title,
        cancelledAt: envelope?.updatedAt
      },
      auditEvent: {
        eventType: auditEvent?.eventType,
        userId: auditEvent?.userId,
        description: auditEvent?.description,
        createdAt: auditEvent?.createdAt
      },
      notificationEvent: {
        type: cancellationEvent?.type,
        envelopeId: cancellationEvent?.payload?.envelopeId,
        cancelledByUserId: cancellationEvent?.payload?.cancelledByUserId,
        timestamp: cancellationEvent?.timestamp
      },
      signers: envelope?.signers.map(signer => ({
        id: signer.id,
        email: signer.email,
        status: signer.status,
        order: signer.order
      })) || []
    };
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Clears mock data for cancellation events
 */
export async function clearCancellationMockData() {
  const outboxMockModule = require('../mocks/aws/outboxMock');
  const publishedEvents = outboxMockModule.publishedEvents || new Map();
  
  // Clear all cancellation events
  for (const [envelopeId, events] of publishedEvents.entries()) {
    const filteredEvents = events.filter((event: any) => event.type !== 'ENVELOPE_CANCELLED');
    if (filteredEvents.length === 0) {
      publishedEvents.delete(envelopeId);
    } else {
      publishedEvents.set(envelopeId, filteredEvents);
    }
  }
}
