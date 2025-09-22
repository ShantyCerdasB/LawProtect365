/**
 * @fileoverview sendEnvelopeHelpers - Helper functions for SendEnvelope integration tests
 * @summary Provides verification utilities for SendEnvelope testing scenarios
 * @description This module contains helper functions for verifying SendEnvelope behavior,
 * including invitation history tracking, duplicate prevention verification, and event validation.
 */

import { outboxMockHelpers } from '../mocks';

/**
 * Interface for expected invitation data
 */
export interface ExpectedInvitation {
  signerId: string;
  message: string;
  eventType: string;
  invitationToken?: string;
}

/**
 * Interface for send envelope options
 */
export interface SendEnvelopeOptions {
  message?: string;
  sendToAll?: boolean;
  signers?: Array<{
    signerId: string;
    message?: string;
  }>;
}

/**
 * Interface for send envelope response
 */
export interface SendEnvelopeResponse {
  statusCode: number;
  data: {
    success: boolean;
    message: string;
    envelopeId: string;
    status: string;
    tokensGenerated: number;
    signersNotified: number;
  };
}

/**
 * Verify invitation history matches expected invitations
 * @param envelopeId - The envelope ID to verify
 * @param expectedInvitations - Array of expected invitations
 * @throws Error if verification fails
 */
export async function verifyInvitationHistory(
  envelopeId: string,
  expectedInvitations: ExpectedInvitation[]
): Promise<void> {
  const invitationEvents = outboxMockHelpers.getInvitationEvents(envelopeId);
  const invitationHistory = outboxMockHelpers.getInvitationHistory(envelopeId);
  
  // Verify correct number of invitations
  expect(invitationEvents.length).toBe(expectedInvitations.length);
  expect(invitationHistory.size).toBe(expectedInvitations.length);
  
  // Verify each expected invitation
  for (const expected of expectedInvitations) {
    // Check invitation history
    expect(invitationHistory.has(expected.signerId)).toBe(true);
    
    // Find corresponding event
    const event = invitationEvents.find(e => e.detail.signerId === expected.signerId);
    expect(event).toBeDefined();
    
    // Verify event details
    expect(event!.detail.eventType).toBe(expected.eventType);
    expect(event!.detail.message).toBe(expected.message);
    expect(event!.detail.envelopeId).toBe(envelopeId);
    
    // Verify invitation token if provided
    if (expected.invitationToken) {
      expect(event!.detail.invitationToken).toBe(expected.invitationToken);
    }
  }
}

/**
 * Verify no duplicate invitations were sent
 * @param envelopeId - The envelope ID to verify
 * @throws Error if duplicates found
 */
export async function verifyNoDuplicateInvitations(
  envelopeId: string
): Promise<void> {
  const invitationEvents = outboxMockHelpers.getInvitationEvents(envelopeId);
  const signerIds = invitationEvents.map(e => e.detail.signerId);
  const uniqueSignerIds = new Set(signerIds);
  
  // Verify no duplicate signer IDs in events
  expect(signerIds.length).toBe(uniqueSignerIds.size);
  
  // Verify invitation history matches events
  const invitationHistory = outboxMockHelpers.getInvitationHistory(envelopeId);
  expect(invitationHistory.size).toBe(uniqueSignerIds.size);
  
  // Verify each signer in history has exactly one event
  for (const signerId of invitationHistory) {
    const eventsForSigner = invitationEvents.filter(e => e.detail.signerId === signerId);
    expect(eventsForSigner.length).toBe(1);
  }
}

/**
 * Verify invitation tokens were generated correctly
 * @param envelopeId - The envelope ID to verify
 * @param expectedSignerCount - Expected number of signers who should receive tokens
 * @throws Error if verification fails
 */
export async function verifyInvitationTokens(
  envelopeId: string,
  expectedSignerCount: number
): Promise<void> {
  // Query real database to verify tokens were created
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();
  
  try {
    const tokens = await prisma.invitationToken.findMany({
      where: { envelopeId }
    });
    
    await prisma.$disconnect();
    
    // Verify correct number of tokens generated
    expect(tokens.length).toBe(expectedSignerCount);
    
    // Verify each token has required properties
    for (const token of tokens) {
      expect(token.id).toBeDefined();
      expect(token.tokenHash).toBeDefined();
      expect(token.envelopeId).toBe(envelopeId);
      expect(token.signerId).toBeDefined();
      expect(token.status).toBe('PENDING');
      expect(token.expiresAt).toBeDefined();
      expect(token.createdAt).toBeDefined();
    }
    
    // Verify no duplicate tokens for same signer
    const signerIds = tokens.map(t => t.signerId);
    const uniqueSignerIds = new Set(signerIds);
    expect(signerIds.length).toBe(uniqueSignerIds.size);
  } catch (error) {
    await prisma.$disconnect();
    throw error;
  }
}

/**
 * Verify specific signer received invitation
 * @param envelopeId - The envelope ID to verify
 * @param signerId - The signer ID to check
 * @param expectedMessage - Expected message content
 * @throws Error if verification fails
 */
export async function verifySignerReceivedInvitation(
  envelopeId: string,
  signerId: string,
  expectedMessage: string
): Promise<void> {
  // Check invitation history
  expect(outboxMockHelpers.hasReceivedInvitation(envelopeId, signerId)).toBe(true);
  
  // Check invitation event
  const invitationEvents = outboxMockHelpers.getInvitationEvents(envelopeId);
  const event = invitationEvents.find(e => e.detail.signerId === signerId);
  expect(event).toBeDefined();
  expect(event!.detail.message).toBe(expectedMessage);
  
  // Check token generation in real database
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();
  
  try {
    const token = await prisma.invitationToken.findFirst({
      where: { 
        envelopeId,
        signerId 
      }
    });
    
    await prisma.$disconnect();
    expect(token).toBeDefined();
    expect(token!.status).toBe('PENDING');
  } catch (error) {
    await prisma.$disconnect();
    throw error;
  }
}

/**
 * Verify specific signer did NOT receive invitation
 * @param envelopeId - The envelope ID to verify
 * @param signerId - The signer ID to check
 * @throws Error if verification fails
 */
export async function verifySignerDidNotReceiveInvitation(
  envelopeId: string,
  signerId: string
): Promise<void> {
  // Check invitation history
  expect(outboxMockHelpers.hasReceivedInvitation(envelopeId, signerId)).toBe(false);
  
  // Check invitation events
  const invitationEvents = outboxMockHelpers.getInvitationEvents(envelopeId);
  const event = invitationEvents.find(e => e.detail.signerId === signerId);
  expect(event).toBeUndefined();
  
  // Check token generation in real database
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();
  
  try {
    const token = await prisma.invitationToken.findFirst({
      where: { 
        envelopeId,
        signerId 
      }
    });
    
    await prisma.$disconnect();
    expect(token).toBeNull();
  } catch (error) {
    await prisma.$disconnect();
    throw error;
  }
}

/**
 * Clear all mock data for test cleanup
 * @param envelopeId - Optional envelope ID to clear specific envelope data
 */
export function clearSendEnvelopeMockData(envelopeId?: string): void {
  if (envelopeId) {
    outboxMockHelpers.clearEnvelope(envelopeId);
  } else {
    outboxMockHelpers.clearAll();
  }
}

/**
 * Get comprehensive send envelope verification summary
 * @param envelopeId - The envelope ID to summarize
 * @returns Object with verification summary
 */
export async function getSendEnvelopeVerificationSummary(envelopeId: string): Promise<{
  invitationHistory: Set<string>;
  invitationEvents: any[];
  totalInvitations: number;
  totalTokens: number;
}> {
  const invitationHistory = outboxMockHelpers.getInvitationHistory(envelopeId);
  const invitationEvents = outboxMockHelpers.getInvitationEvents(envelopeId);
  
  // Query real database for tokens
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();
  
  try {
    const tokens = await prisma.invitationToken.findMany({
      where: { envelopeId }
    });
    
    await prisma.$disconnect();
    
    return {
      invitationHistory,
      invitationEvents,
      totalInvitations: invitationEvents.length,
      totalTokens: tokens.length
    };
  } catch (error) {
    await prisma.$disconnect();
    throw error;
  }
}
