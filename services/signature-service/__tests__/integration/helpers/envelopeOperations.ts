/**
 * @fileoverview envelopeOperations - Envelope operations for integration tests
 * @summary Provides envelope CRUD operations and workflow methods
 * @description This module contains envelope operation methods for integration tests,
 * including create, update, send, and get operations with proper authentication.
 */

import { randomUUID } from 'crypto';
import { createApiGatewayEvent, generateTestJwtToken } from './testHelpers';
import { createEnvelopeHandler } from '../../../src/handlers/envelopes/CreateEnvelopeHandler';
import { updateEnvelopeHandler } from '../../../src/handlers/envelopes/UpdateEnvelopeHandler';
import { sendEnvelopeHandler } from '../../../src/handlers/envelopes/SendEnvelopeHandler';
import { getEnvelopeHandler } from '../../../src/handlers/envelopes/GetEnvelopeHandler';
import { getEnvelopesByUserHandler } from '../../../src/handlers/envelopes/GetEnvelopesByUserHandler';
import { signDocumentHandler } from '../../../src/handlers/signing/SignDocumentHandler';
import { declineSignerHandler } from '../../../src/handlers/signing/DeclineSignerHandler';
import { cancelEnvelopeHandler } from '../../../src/handlers/envelopes/CancelEnvelopeHandler';
import { TestUser, EnvelopeData } from './testTypes';

/**
 * Envelope operations for integration tests
 */
export class EnvelopeOperations {
  constructor(private testUser: TestUser, private testSourceKey: string) {}

  /**
   * Create envelope with specified data
   * @param envelopeData - Envelope creation data
   * @returns Promise that resolves to the created envelope data
   */
  async createEnvelope(envelopeData: {
    title: string;
    description: string;
    signingOrderType?: string;
    originType: string;
    templateId?: string;
    templateVersion?: string;
    sourceKey?: string;
    metaKey?: string;
  }): Promise<EnvelopeData> {
    const token = await generateTestJwtToken({ 
      sub: this.testUser.userId, 
      email: this.testUser.email, 
      roles: ['admin'], 
      scopes: [] 
    });
    
    const event = await createApiGatewayEvent({ 
      includeAuth: false, 
      authToken: token,
      headers: {
        'x-country': 'US',
        'x-forwarded-for': '127.0.0.1'
      },
      body: JSON.stringify({
        title: envelopeData.title,
        description: envelopeData.description,
        signingOrderType: envelopeData.signingOrderType || 'OWNER_FIRST',
        originType: envelopeData.originType,
        templateId: envelopeData.templateId,
        templateVersion: envelopeData.templateVersion,
        sourceKey: envelopeData.sourceKey || this.testSourceKey,
        metaKey: envelopeData.metaKey || `test-meta/${randomUUID()}.json`
      })
    });

    const result = await createEnvelopeHandler(event) as any;
    const response = JSON.parse(result.body);

    if (result.statusCode !== 201) {
      // Preserve the original error structure
      const error = new Error(response.message);
      (error as any).statusCode = result.statusCode;
      (error as any).message = response.message;
      throw error;
    }

    return response.data;
  }

  /**
   * Update envelope with specified data
   * @param envelopeId - ID of the envelope to update
   * @param updateData - Update data
   * @returns Promise that resolves to the update response
   */
  async updateEnvelope(envelopeId: string, updateData: Record<string, any>): Promise<{
    statusCode: number;
    data: any;
  }> {
    const token = await generateTestJwtToken({ 
      sub: this.testUser.userId, 
      email: this.testUser.email, 
      roles: ['admin'], 
      scopes: [] 
    });
    
    const event = await createApiGatewayEvent({
      includeAuth: false,
      authToken: token,
      pathParameters: { id: envelopeId },
      body: JSON.stringify(updateData),
      headers: {
        'x-country': 'US',
        'x-forwarded-for': '127.0.0.1'
      }
    });
    
    const result = await updateEnvelopeHandler(event) as any;
    const response = JSON.parse(result.body);
    
    return { 
      statusCode: result.statusCode, 
      data: response.data || response // For errors, response doesn't have 'data' field
    };
  }

  /**
   * Update envelope metadata
   * @param envelopeId - ID of the envelope
   * @param metadata - Metadata to update
   * @returns Promise that resolves to the update response
   */
  async updateMetadata(envelopeId: string, metadata: {
    title?: string;
    description?: string;
    expiresAt?: string;
    sourceKey?: string;
    metaKey?: string;
  }): Promise<{
    statusCode: number;
    data: any;
  }> {
    return this.updateEnvelope(envelopeId, metadata);
  }

  /**
   * Send envelope to signers
   * @param envelopeId - The envelope ID to send
   * @param options - Send options including message and signer targeting
   * @returns Send envelope response
   */
  async sendEnvelope(
    envelopeId: string,
    options: {
      message?: string;
      sendToAll?: boolean;
      signers?: Array<{
        signerId: string;
        message?: string;
      }>;
    }
  ): Promise<{ statusCode: number; data: any }> {
    const authToken = await generateTestJwtToken({
      sub: this.testUser.userId,
      email: this.testUser.email,
      roles: [this.testUser.role]
    });

    const event = await createApiGatewayEvent({
      pathParameters: { envelopeId },
      body: options,
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'x-country': 'US' // Required for SendEnvelope security context
      }
    });

    const result = await sendEnvelopeHandler(event) as any;
    const response = JSON.parse(result.body);
    
    return {
      statusCode: result.statusCode,
      data: response.data // Access the actual data from ControllerFactory response
    };
  }

  /**
   * Get envelope by ID (authenticated user)
   * @param envelopeId - The envelope ID to get
   * @returns Get envelope response
   */
  async getEnvelope(envelopeId: string): Promise<{ statusCode: number; data: any }> {
    const authToken = await generateTestJwtToken({
      sub: this.testUser.userId,
      email: this.testUser.email,
      roles: [this.testUser.role]
    });

    const event = await createApiGatewayEvent({
      includeAuth: false,  // ✅ Usar patrón correcto
      authToken: authToken, // ✅ Usar patrón correcto
      pathParameters: { id: envelopeId },
      headers: {
        'x-country': 'US',
        'x-forwarded-for': '127.0.0.1'
      }
    });

    const result = await getEnvelopeHandler(event) as any;
    const response = JSON.parse(result.body);
    
    return {
      statusCode: result.statusCode,
      data: response.data || response
    };
  }

  /**
   * Get envelope by ID with invitation token (external user)
   * @param envelopeId - The envelope ID to get
   * @param invitationToken - The invitation token for external access
   * @returns Get envelope response
   */
  async getEnvelopeWithToken(envelopeId: string, invitationToken: string): Promise<{ statusCode: number; data: any }> {
    const event = await createApiGatewayEvent({
      includeAuth: false,  // ✅ Para external users
      pathParameters: { id: envelopeId },
      queryStringParameters: { invitationToken },
      headers: {
        'x-country': 'US',
        'x-forwarded-for': '127.0.0.1',
        'user-agent': 'Test User Agent'
      }
    });

    const result = await getEnvelopeHandler(event) as any;
    const response = JSON.parse(result.body);
    
    return {
      statusCode: result.statusCode,
      data: response.data || response
    };
  }

  /**
   * Get envelopes by user with pagination and filtering
   * @param filters - Query filters including status, limit, and cursor
   * @returns Get envelopes response
   */
  async getEnvelopesByUser(filters: {
    status?: string;
    limit: number;
    cursor?: string;
  }): Promise<{ statusCode: number; data: any }> {
    const authToken = await generateTestJwtToken({
      sub: this.testUser.userId,
      email: this.testUser.email,
      roles: [this.testUser.role]
    });

    const event = await createApiGatewayEvent({
      includeAuth: false,  // ✅ Usar patrón correcto
      authToken: authToken, // ✅ Usar patrón correcto
      queryStringParameters: Object.fromEntries(
        Object.entries(filters)
          .filter(([_, value]) => value !== undefined)
          .map(([key, value]) => [key, String(value)])
      ),
      headers: {
        'x-country': 'US',
        'x-forwarded-for': '127.0.0.1'
      }
    });

    const result = await getEnvelopesByUserHandler(event) as any;
    const response = JSON.parse(result.body);
    
    return {
      statusCode: result.statusCode,
      data: response.data || response
    };
  }

  /**
   * Sign document with invitation token (external user)
   * @param envelopeId - The envelope ID to sign
   * @param signerId - The signer ID
   * @param invitationToken - The invitation token for external access
   * @param consent - Consent information
   * @returns Sign document response
   */
  async signDocument(
    envelopeId: string,
    signerId: string,
    invitationToken: string,
    consent: {
      given: boolean;
      timestamp: string;
      text: string;
      ipAddress?: string;
      userAgent?: string;
      country?: string;
    }
  ): Promise<{ statusCode: number; data: any }> {
    const event = await createApiGatewayEvent({
      includeAuth: false,  // ✅ Para external users
      pathParameters: { id: envelopeId }, // ✅ Cambiar envelopeId por id
      body: JSON.stringify({
        invitationToken,
        signerId,
        flattenedKey: "test-flattened-document.pdf", // Mock flattened document key
        consent
      }),
      headers: {
        'x-country': 'US',
        'x-forwarded-for': '127.0.0.1',
        'user-agent': 'Test User Agent'
      }
    });

    const result = await signDocumentHandler(event) as any;
    const response = JSON.parse(result.body);
    
    return {
      statusCode: result.statusCode,
      data: response.data || response
    };
  }

  /**
   * Sign document as authenticated user (owner)
   * @param envelopeId - The envelope ID to sign
   * @param signerId - The signer ID
   * @param consent - Consent information
   * @returns Sign document response
   */
  async signDocumentAsOwner(
    envelopeId: string,
    signerId: string,
    consent: {
      given: boolean;
      timestamp: string;
      text: string;
      ipAddress?: string;
      userAgent?: string;
      country?: string;
    }
  ): Promise<{ statusCode: number; data: any }> {
    const authToken = await generateTestJwtToken({
      sub: this.testUser.userId,
      email: this.testUser.email,
      roles: [this.testUser.role]
    });

    const event = await createApiGatewayEvent({
      includeAuth: false,
      authToken: authToken,
      pathParameters: { id: envelopeId }, // ✅ Cambiar envelopeId por id
      body: JSON.stringify({
        envelopeId,
        signerId,
        flattenedKey: "test-flattened-document.pdf", // Mock flattened document key
        consent
      }),
      headers: {
        'x-country': 'US',
        'x-forwarded-for': '127.0.0.1',
        'user-agent': 'Test User Agent'
      }
    });

    const result = await signDocumentHandler(event) as any;
    const response = JSON.parse(result.body);
    
    return {
      statusCode: result.statusCode,
      data: response.data || response
    };
  }

  /**
   * Decline signer with invitation token
   * @param envelopeId - ID of the envelope
   * @param signerId - ID of the signer declining
   * @param invitationToken - Invitation token for the signer
   * @param reason - Reason for declining
   * @returns Promise that resolves to the decline response
   */
  async declineSigner(
    envelopeId: string,
    signerId: string,
    invitationToken: string,
    reason: string
  ): Promise<{ statusCode: number; data: any }> {
    console.log('🔍 Decline request params:', { envelopeId, signerId, invitationToken, reason });

    const token = await generateTestJwtToken({
      sub: this.testUser.userId, 
      email: this.testUser.email, 
      roles: ['admin'], 
      scopes: [] 
    });
    
    const event = await createApiGatewayEvent({
      includeAuth: true,
      authToken: token,
      pathParameters: { id: envelopeId, signerId },
      body: JSON.stringify({
        invitationToken,
        reason: reason || 'No reason provided',
        metadata: {
          ipAddress: '127.0.0.1',
          userAgent: 'test-agent',
          timestamp: new Date().toISOString()
        }
      }),
      headers: {
        'x-country': 'US',
        'x-forwarded-for': '127.0.0.1',
        'user-agent': 'Test User Agent'
      }
    });
    
    const result = await declineSignerHandler(event) as any;
    const response = JSON.parse(result.body);

    return {
      statusCode: result.statusCode,
      data: response.data || response
    };
  }

  /**
   * Cancel an envelope
   * @param envelopeId - ID of the envelope to cancel
   * @returns Promise that resolves to the cancellation response
   */
  async cancelEnvelope(envelopeId: string): Promise<{ statusCode: number; data: any }> {
    const token = await generateTestJwtToken({
      sub: this.testUser.userId, 
      email: this.testUser.email, 
      roles: ['admin'], 
      scopes: [] 
    });
    
    const event = await createApiGatewayEvent({
      includeAuth: true,
      authToken: token,
      pathParameters: { id: envelopeId },
      body: {}, // Empty body for cancellation
      headers: {
        'x-forwarded-for': '127.0.0.1',
        'user-agent': 'Test User Agent'
      }
    });
    
    const result = await cancelEnvelopeHandler(event) as any;
    const response = JSON.parse(result.body);

    return {
      statusCode: result.statusCode,
      data: response.data || response
    };
  }

}
