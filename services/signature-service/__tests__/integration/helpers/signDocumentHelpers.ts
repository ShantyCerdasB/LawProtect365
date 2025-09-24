/**
 * @fileoverview signDocumentHelpers - Helper functions for SignDocument integration tests
 * @summary Provides verification utilities for SignDocument testing scenarios
 * @description This module contains helper functions for verifying SignDocument behavior,
 * including signature verification, consent validation, and envelope completion checks.
 */

/**
 * Interface for consent data
 */
export interface ConsentData {
  given: boolean;
  timestamp: string;
  text: string;
  ipAddress?: string;
  userAgent?: string;
  country?: string;
}

/**
 * Interface for sign document response
 */
export interface SignDocumentResponse {
  statusCode: number;
  data: {
    message: string;
    signature: {
      id: string;
      signerId: string;
      envelopeId: string;
      signedAt: string;
      algorithm: string;
      hash: string;
    };
    envelope: {
      id: string;
      status: string;
      progress: number;
    };
  };
}

/**
 * Verify signature was created in database
 * @param envelopeId - The envelope ID to verify
 * @param signerId - The signer ID to check
 * @throws Error if verification fails
 */
export async function verifySignatureInDatabase(
  envelopeId: string,
  signerId: string
): Promise<void> {
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();
  
  try {
    // Check if signer status is SIGNED
    const signer = await prisma.envelopeSigner.findFirst({
      where: { 
        envelopeId,
        id: signerId 
      }
    });
    
    await prisma.$disconnect();
    
    expect(signer).toBeDefined();
    expect(signer!.status).toBe('SIGNED');
    expect(signer!.signedAt).toBeDefined();
    expect(signer!.documentHash).toBeDefined();
    expect(signer!.signatureHash).toBeDefined();
    expect(signer!.kmsKeyId).toBeDefined();
    expect(signer!.algorithm).toBeDefined();
  } catch (error) {
    await prisma.$disconnect();
    throw error;
  }
}

/**
 * Verify consent record was created in database
 * @param envelopeId - The envelope ID to verify
 * @param signerId - The signer ID to check
 * @param expectedConsent - Expected consent data
 * @throws Error if verification fails
 */
export async function verifyConsentRecord(
  envelopeId: string,
  signerId: string,
  expectedConsent: ConsentData
): Promise<void> {
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();
  
  try {
    const consent = await prisma.consent.findFirst({
      where: { 
        envelopeId,
        signerId 
      }
    });
    
    await prisma.$disconnect();
    
    expect(consent).toBeDefined();
    expect(consent!.consentGiven).toBe(expectedConsent.given);
    expect(consent!.consentText).toBe(expectedConsent.text);
    expect(consent!.ipAddress).toBe(expectedConsent.ipAddress || '127.0.0.1');
    expect(consent!.userAgent).toBe(expectedConsent.userAgent || 'Test User Agent');
    expect(consent!.country).toBe(expectedConsent.country || 'US');
    expect(consent!.signatureId).toBeDefined(); // Should be linked to signature
  } catch (error) {
    await prisma.$disconnect();
    throw error;
  }
}

/**
 * Verify envelope completion status
 * @param envelopeId - The envelope ID to verify
 * @param expectedStatus - Expected envelope status
 * @throws Error if verification fails
 */
export async function verifyEnvelopeCompletion(
  envelopeId: string,
  expectedStatus: string = 'COMPLETED'
): Promise<void> {
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();
  
  try {
    const envelope = await prisma.signatureEnvelope.findUnique({
      where: { id: envelopeId },
      include: {
        signers: true
      }
    });
    
    await prisma.$disconnect();
    
    expect(envelope).toBeDefined();
    expect(envelope!.status).toBe(expectedStatus);
    
    if (expectedStatus === 'COMPLETED') {
      expect(envelope!.completedAt).toBeDefined();
      expect(envelope!.signedKey).toBeDefined();
      expect(envelope!.signedSha256).toBeDefined();
      
      // Verify all signers are signed
      const allSigned = envelope!.signers.every(signer => signer.status === 'SIGNED');
      expect(allSigned).toBe(true);
    }
  } catch (error) {
    await prisma.$disconnect();
    throw error;
  }
}

/**
 * Verify envelope progress calculation
 * @param envelopeId - The envelope ID to verify
 * @param expectedProgress - Expected progress percentage
 * @throws Error if verification fails
 */
export async function verifyEnvelopeProgress(
  envelopeId: string,
  expectedProgress: number
): Promise<void> {
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();
  
  try {
    const envelope = await prisma.signatureEnvelope.findUnique({
      where: { id: envelopeId },
      include: {
        signers: true
      }
    });
    
    await prisma.$disconnect();
    
    expect(envelope).toBeDefined();
    
    // Calculate actual progress
    const totalSigners = envelope!.signers.length;
    const signedSigners = envelope!.signers.filter(s => s.status === 'SIGNED').length;
    const actualProgress = totalSigners === 0 ? 0 : Math.round((signedSigners / totalSigners) * 100);
    
    expect(actualProgress).toBe(expectedProgress);
  } catch (error) {
    await prisma.$disconnect();
    throw error;
  }
}

/**
 * Verify audit event was created for signing
 * @param envelopeId - The envelope ID to verify
 * @param signerId - The signer ID to check
 * @param eventType - Expected event type
 * @throws Error if verification fails
 */
export async function verifySigningAuditEvent(
  envelopeId: string,
  signerId: string,
  eventType: string = 'DOCUMENT_SIGNED'
): Promise<void> {
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();
  
  try {
    const auditEvent = await prisma.signatureAuditEvent.findFirst({
      where: { 
        envelopeId,
        signerId,
        eventType
      }
    });
    
    await prisma.$disconnect();
    
    expect(auditEvent).toBeDefined();
    expect(auditEvent!.eventType).toBe(eventType);
    expect(auditEvent!.description).toContain('Document signed');
    expect(auditEvent!.metadata).toBeDefined();
    
    // Verify metadata contains signature information
    const metadata = auditEvent!.metadata as any;
    expect(metadata.envelopeId).toBe(envelopeId);
    expect(metadata.signerId).toBe(signerId);
    expect(metadata.signatureId).toBeDefined();
    expect(metadata.documentHash).toBeDefined();
    expect(metadata.signatureHash).toBeDefined();
    expect(metadata.kmsKeyId).toBeDefined();
  } catch (error) {
    await prisma.$disconnect();
    throw error;
  }
}

/**
 * Verify invitation token is still valid after signing
 * @param envelopeId - The envelope ID to verify
 * @param signerId - The signer ID to check
 * @throws Error if verification fails
 */
export async function verifyInvitationTokenStillValid(
  envelopeId: string,
  signerId: string
): Promise<void> {
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
    
    // Token should still exist and be active (not consumed)
    expect(token).toBeDefined();
    expect(token!.status).toBe('ACTIVE');
  } catch (error) {
    await prisma.$disconnect();
    throw error;
  }
}

/**
 * Get comprehensive signing verification summary
 * @param envelopeId - The envelope ID to summarize
 * @returns Object with verification summary
 */
export async function getSigningVerificationSummary(envelopeId: string): Promise<{
  envelope: any;
  signers: any[];
  signatures: any[];
  consents: any[];
  auditEvents: any[];
  invitationTokens: any[];
}> {
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();
  
  try {
    const envelope = await prisma.signatureEnvelope.findUnique({
      where: { id: envelopeId },
      include: {
        signers: true
      }
    });
    
    const signatures = await prisma.envelopeSigner.findMany({
      where: { 
        envelopeId,
        status: 'SIGNED'
      }
    });
    
    const consents = await prisma.consent.findMany({
      where: { envelopeId }
    });
    
    const auditEvents = await prisma.signatureAuditEvent.findMany({
      where: { envelopeId }
    });
    
    const invitationTokens = await prisma.invitationToken.findMany({
      where: { envelopeId }
    });
    
    await prisma.$disconnect();
    
    return {
      envelope,
      signers: envelope?.signers || [],
      signatures,
      consents,
      auditEvents,
      invitationTokens
    };
  } catch (error) {
    await prisma.$disconnect();
    throw error;
  }
}

/**
 * Create test consent data with defaults
 * @param overrides - Optional overrides for consent data
 * @returns Consent data object
 */
export function createTestConsent(overrides?: Partial<ConsentData>): ConsentData {
  return {
    given: true,
    timestamp: new Date().toISOString(),
    text: 'I agree to sign this document electronically',
    ipAddress: '127.0.0.1',
    userAgent: 'Test User Agent',
    country: 'US',
    ...overrides
  };
}
