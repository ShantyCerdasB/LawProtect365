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
}
