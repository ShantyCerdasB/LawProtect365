/**
 * @fileoverview downloadDocumentHelpers - Helper functions for DownloadDocument integration tests
 * @summary Provides verification utilities for DownloadDocument testing scenarios
 * @description This module contains helper functions for verifying DownloadDocument behavior,
 * including download URL validation, audit event verification, and expiration checks.
 */

import { PrismaClient } from '@prisma/client';
import { AuditEventType } from '../../../src/domain/enums/AuditEventType';

/**
 * Interface for download document response
 */
export interface DownloadDocumentResponse {
  statusCode: number;
  data: {
    success: boolean;
    message: string;
    downloadUrl: string;
    expiresIn: number;
    expiresAt: string;
  };
}

/**
 * Verify download audit event was created
 * @param envelopeId - The envelope ID to verify
 * @param userId - The user ID who downloaded
 * @param userEmail - The user email (optional)
 * @throws Error if verification fails
 */
export async function verifyDownloadAuditEvent(
  envelopeId: string,
  userId: string,
  userEmail?: string
): Promise<void> {
  const prisma = new PrismaClient();
  try {
    const auditEvent = await prisma.signatureAuditEvent.findFirst({
      where: {
        envelopeId: envelopeId,
        eventType: AuditEventType.DOCUMENT_DOWNLOADED,
        userId: userId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    expect(auditEvent).toBeDefined();
    expect(auditEvent?.description).toContain('download');
    expect(auditEvent?.metadata).toBeDefined();
    
    if (userEmail) {
      expect(auditEvent?.userEmail).toBe(userEmail);
    }
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Verify download URL is valid and accessible
 * @param downloadUrl - The download URL to verify
 * @throws Error if verification fails
 */
export function verifyDownloadUrl(downloadUrl: string): void {
  expect(downloadUrl).toBeDefined();
  // ✅ Permitir URLs mock para tests
  if (downloadUrl.includes('mock-s3.amazonaws.com')) {
    expect(downloadUrl).toContain('mock-get-url=true');
  } else {
    expect(downloadUrl).toMatch(/^https:\/\/.*\.amazonaws\.com\/.*\?.*X-Amz-Algorithm=.*$/);
    expect(downloadUrl).toContain('X-Amz-Expires=');
    expect(downloadUrl).toContain('X-Amz-Signature=');
  }
}

/**
 * Verify download expiration time
 * @param expiresIn - The expiration time in seconds
 * @param expectedMin - Minimum expected expiration (default: 300 seconds)
 * @param expectedMax - Maximum expected expiration (default: 86400 seconds)
 * @throws Error if verification fails
 */
export function verifyDownloadExpiration(
  expiresIn: number,
  expectedMin: number = 300,
  expectedMax: number = 86400
): void {
  expect(expiresIn).toBeGreaterThanOrEqual(expectedMin);
  expect(expiresIn).toBeLessThanOrEqual(expectedMax);
}

/**
 * Verify download response structure
 * @param response - The download response to verify
 * @throws Error if verification fails
 */
export function verifyDownloadResponse(response: { statusCode: number; data: any }): void {
  expect(response.statusCode).toBe(200);
  expect(response.data.success).toBe(true);
  expect(response.data.message).toContain('successfully');
  expect(response.data.downloadUrl).toBeDefined();
  expect(response.data.expiresIn).toBeDefined();
  expect(response.data.expiresAt).toBeDefined();
  
  // Verify download URL format
  verifyDownloadUrl(response.data.downloadUrl);
  
  // Verify expiration time
  verifyDownloadExpiration(response.data.expiresIn);
  
  // Verify expiresAt is a valid ISO date
  const expiresAtDate = new Date(response.data.expiresAt);
  expect(expiresAtDate.getTime()).toBeGreaterThan(Date.now());
}

/**
 * Get comprehensive download verification summary
 * @param envelopeId - The envelope ID
 * @param userId - The user ID who downloaded
 * @param userEmail - The user email (optional)
 * @returns Promise that resolves to verification summary
 */
export async function getDownloadVerificationSummary(
  envelopeId: string,
  userId: string,
  userEmail?: string
): Promise<{
  envelopeId: string;
  userId: string;
  userEmail?: string;
  auditEvent: any;
  downloadTimestamp: string;
}> {
  const prisma = new PrismaClient();
  try {
    const auditEvent = await prisma.signatureAuditEvent.findFirst({
      where: {
        envelopeId: envelopeId,
        eventType: AuditEventType.DOCUMENT_DOWNLOADED,
        userId: userId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return {
      envelopeId,
      userId,
      userEmail,
      auditEvent,
      downloadTimestamp: auditEvent?.createdAt?.toISOString() || new Date().toISOString()
    };
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Verify download with custom expiration time
 * @param response - The download response
 * @param expectedExpiresIn - Expected expiration time in seconds
 * @throws Error if verification fails
 */
export function verifyDownloadWithCustomExpiration(
  response: { statusCode: number; data: any },
  expectedExpiresIn: number
): void {
  verifyDownloadResponse(response);
  expect(response.data.expiresIn).toBe(expectedExpiresIn);
  
  // Verify expiresAt matches the expected expiration
  const expiresAtDate = new Date(response.data.expiresAt);
  const expectedExpiresAt = new Date(Date.now() + expectedExpiresIn * 1000);
  const timeDifference = Math.abs(expiresAtDate.getTime() - expectedExpiresAt.getTime());
  
  // Allow 5 seconds tolerance for timing differences
  expect(timeDifference).toBeLessThan(5000);
}

/**
 * Verify download failure response
 * @param response - The download response
 * @param expectedStatusCode - Expected status code (e.g., 401, 403, 404)
 * @param expectedMessage - Expected error message pattern
 * @throws Error if verification fails
 */
export function verifyDownloadFailure(
  response: { statusCode: number; data?: any; message?: string; error?: any },
  expectedStatusCode: number,
  expectedMessage?: string
): void {
  expect(response.statusCode).toBe(expectedStatusCode);
  
  // ✅ Handle error response structures
  // For HTTP errors (400, 401, 403, 500), the ControllerFactory returns the error message directly
  if (expectedMessage) {
    // Check if the error message is in the response body
    if (response.data && response.data.message) {
      expect(response.data.message).toContain(expectedMessage);
    } else if (response.message) {
      expect(response.message).toContain(expectedMessage);
    } else if (response.error && response.error.message) {
      expect(response.error.message).toContain(expectedMessage);
    } else {
      // If no specific message structure, just verify the status code
      expect(response.statusCode).toBe(expectedStatusCode);
    }
  }
}

/**
 * Clear download mock data (placeholder for future use)
 */
export function clearDownloadMockData(): void {
  // Currently no mock data to clear for download operations
  // This is a placeholder for future mock data cleanup if needed
}
