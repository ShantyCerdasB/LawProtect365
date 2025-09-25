/**
 * @fileoverview databaseHelper - Database operations for integration tests
 * @summary Provides database access methods for test verification and data retrieval
 * @description This module contains database helper methods for integration tests,
 * including signer retrieval, envelope queries, and audit event access.
 */

/**
 * Database helper for integration tests
 */
export class DatabaseHelper {
  /**
   * Get signers from database for verification
   * @param envelopeId - ID of the envelope
   * @returns Promise that resolves to array of signers
   */
  async getSignersFromDatabase(envelopeId: string): Promise<any[]> {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    const signers = await prisma.envelopeSigner.findMany({
      where: { envelopeId },
      orderBy: { order: 'asc' }
    });
    
    await prisma.$disconnect();
    return signers;
  }

  /**
   * Get envelope from database for verification
   * @param envelopeId - ID of the envelope
   * @returns Promise that resolves to envelope data
   */
  async getEnvelopeFromDatabase(envelopeId: string): Promise<any> {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    const envelope = await prisma.signatureEnvelope.findUnique({
      where: { id: envelopeId }
    });
    
    await prisma.$disconnect();
    return envelope;
  }

  /**
   * Get audit events from database for verification
   * @param envelopeId - The envelope ID to get audit events for
   * @returns Array of audit events
   */
  async getAuditEventsFromDatabase(envelopeId: string): Promise<any[]> {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    const auditEvents = await prisma.signatureAuditEvent.findMany({
      where: { envelopeId },
      orderBy: { createdAt: 'desc' }
    });
    
    await prisma.$disconnect();
    return auditEvents;
  }

  /**
   * Get viewer participant by envelope ID and email
   * @param envelopeId - The envelope ID
   * @param email - The viewer email
   * @returns Viewer participant data
   */
  async getViewerParticipant(envelopeId: string, email: string): Promise<any> {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    const viewerParticipant = await prisma.envelopeSigner.findFirst({
      where: { 
        envelopeId,
        email: email.toLowerCase(),
        participantRole: 'VIEWER'
      }
    });
    
    await prisma.$disconnect();
    return viewerParticipant;
  }

  /**
   * Get invitation token by token string
   * @param token - The invitation token
   * @returns Invitation token data
   */
  async getInvitationToken(token: string): Promise<any> {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    // Hash the token to find it in the database
    const crypto = await import('crypto');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    
    const invitationToken = await prisma.invitationToken.findFirst({
      where: { tokenHash }
    });
    
    if (!invitationToken) {
      await prisma.$disconnect();
      return null;
    }
    
    // Get the signer information separately
    const signer = await prisma.envelopeSigner.findUnique({
      where: { id: invitationToken.signerId }
    });
    
    await prisma.$disconnect();
    
    return {
      ...invitationToken,
      signer
    };
  }
}
