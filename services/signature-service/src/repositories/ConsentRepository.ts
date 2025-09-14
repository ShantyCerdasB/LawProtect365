/**
 * @fileoverview ConsentRepository - Repository for consent data access
 * @summary Handles consent persistence and retrieval operations
 * @description The ConsentRepository manages consent records in DynamoDB,
 * providing methods for creating, retrieving, and linking consent with signatures.
 */

import type { DdbClientLike } from '@lawprotect/shared-ts';
import { mapAwsError, ConflictError, NotFoundError, ErrorCodes } from '@lawprotect/shared-ts';
import { Consent } from '../domain/entities/Consent';
import { ConsentId } from '../domain/value-objects/ConsentId';
import { EnvelopeId } from '../domain/value-objects/EnvelopeId';
import { SignerId } from '../domain/value-objects/SignerId';
import { SignatureId } from '../domain/value-objects/SignatureId';
import type { CreateConsentRequest } from '../domain/types/consent/CreateConsentRequest';
import type {
  ConsentListResult,
  ConsentCountResult,
  ConsentQueryOptions
} from '../domain/types/infrastructure/consent';
import {
  consentToDdbItem,
  consentFromDdbItem,
  isConsentDdbItem,
  createConsentFromRequest,
  ConsentKeyBuilders
} from '../domain/types/infrastructure/consent';

/**
 * ConsentRepository implementation for DynamoDB
 * 
 * Manages consent records using single-table pattern with GSI for
 * envelope and signer-based queries.
 */
export class ConsentRepository {
  constructor(
    private readonly tableName: string,
    private readonly ddb: DdbClientLike
  ) {}

  /**
   * Creates a new consent record
   * @param request - Consent creation request
   * @returns Created consent entity
   */
  async create(request: CreateConsentRequest): Promise<Consent> {
    const consent = createConsentFromRequest({
      id: ConsentId.generate(),
      envelopeId: request.envelopeId,
      signerId: request.signerId,
      signatureId: request.signatureId,
      consentGiven: request.consentGiven,
      consentTimestamp: request.consentTimestamp,
      consentText: request.consentText,
      ipAddress: request.ipAddress,
      userAgent: request.userAgent
    });

    const item = consentToDdbItem(consent);

    try {
      await this.ddb.put({
        TableName: this.tableName,
        Item: item as unknown as Record<string, unknown>,
        ConditionExpression: 'attribute_not_exists(pk) AND attribute_not_exists(sk)'
      });

      return consent;
    } catch (err: any) {
      if (String(err?.name) === 'ConditionalCheckFailedException') {
        throw new ConflictError('Consent already exists', ErrorCodes.COMMON_CONFLICT);
      }
      throw mapAwsError(err, 'ConsentRepository.create');
    }
  }

  /**
   * Gets consent by ID
   * @param consentId - Consent ID
   * @returns Consent entity or null if not found
   */
  async getById(consentId: ConsentId): Promise<Consent | null> {
    try {
      const result = await this.ddb.get({
        TableName: this.tableName,
        Key: ConsentKeyBuilders.buildPrimaryKey(consentId.getValue())
      });

      if (!result.Item) {
        return null;
      }

      if (!isConsentDdbItem(result.Item)) {
        throw new Error('Invalid consent item structure');
      }

      return consentFromDdbItem(result.Item);
    } catch (err) {
      throw mapAwsError(err, 'ConsentRepository.getById');
    }
  }

  /**
   * Gets consent by signer and envelope
   * @param signerId - Signer ID
   * @param envelopeId - Envelope ID
   * @returns Consent entity or null if not found
   */
  async getBySignerAndEnvelope(signerId: SignerId, envelopeId: EnvelopeId): Promise<Consent | null> {
    try {
      const result = await this.ddb.query!({
        TableName: this.tableName,
        IndexName: 'GSI2',
        KeyConditionExpression: '#gsi2pk = :gsi2pk',
        FilterExpression: '#envelopeId = :envelopeId',
        ExpressionAttributeNames: {
          '#gsi2pk': 'gsi2pk',
          '#envelopeId': 'envelopeId'
        },
        ExpressionAttributeValues: {
          ':gsi2pk': ConsentKeyBuilders.buildSignerGsi2Key(signerId.getValue(), '').gsi2pk,
          ':envelopeId': envelopeId.getValue()
        },
        Limit: 1
      });

      if (!result.Items || result.Items.length === 0) {
        return null;
      }

      const item = result.Items[0] as Record<string, unknown>;
      if (!isConsentDdbItem(item)) {
        throw new Error('Invalid consent item structure');
      }

      return consentFromDdbItem(item as any);
    } catch (err) {
      throw mapAwsError(err, 'ConsentRepository.getBySignerAndEnvelope');
    }
  }

  /**
   * Gets all consents for an envelope
   * @param envelopeId - Envelope ID
   * @returns Array of consent entities
   */
  async getByEnvelope(envelopeId: EnvelopeId): Promise<Consent[]> {
    try {
      const result = await this.ddb.query!({
        TableName: this.tableName,
        IndexName: 'GSI1',
        KeyConditionExpression: '#gsi1pk = :gsi1pk',
        ExpressionAttributeNames: {
          '#gsi1pk': 'gsi1pk'
        },
        ExpressionAttributeValues: {
          ':gsi1pk': ConsentKeyBuilders.buildEnvelopeGsi1Key(envelopeId.getValue(), '').gsi1pk
        }
      });

      if (!result.Items) {
        return [];
      }

      return result.Items
        .filter(isConsentDdbItem)
        .map(item => consentFromDdbItem(item as any));
    } catch (err) {
      throw mapAwsError(err, 'ConsentRepository.getByEnvelope');
    }
  }

  /**
   * Gets all consents for a signer
   * @param signerId - Signer ID
   * @returns Array of consent entities
   */
  async getBySigner(signerId: SignerId): Promise<Consent[]> {
    try {
      const result = await this.ddb.query!({
        TableName: this.tableName,
        IndexName: 'GSI2',
        KeyConditionExpression: '#gsi2pk = :gsi2pk',
        ExpressionAttributeNames: {
          '#gsi2pk': 'gsi2pk'
        },
        ExpressionAttributeValues: {
          ':gsi2pk': ConsentKeyBuilders.buildSignerGsi2Key(signerId.getValue(), '').gsi2pk
        }
      });

      if (!result.Items) {
        return [];
      }

      return result.Items
        .filter(isConsentDdbItem)
        .map(item => consentFromDdbItem(item as any));
    } catch (err) {
      throw mapAwsError(err, 'ConsentRepository.getBySigner');
    }
  }

  /**
   * Links consent with a signature
   * @param consentId - Consent ID
   * @param signatureId - Signature ID
   * @returns Updated consent entity
   */
  async linkWithSignature(consentId: ConsentId, signatureId: SignatureId): Promise<Consent> {
    try {
      const existingConsent = await this.getById(consentId);
      if (!existingConsent) {
        throw new NotFoundError('Consent not found', ErrorCodes.COMMON_NOT_FOUND);
      }

      const updatedConsent = existingConsent.linkWithSignature(signatureId);

      await this.ddb.update!({
        TableName: this.tableName,
        Key: ConsentKeyBuilders.buildPrimaryKey(consentId.getValue()),
        UpdateExpression: 'SET #signatureId = :signatureId, #updatedAt = :updatedAt',
        ExpressionAttributeNames: {
          '#signatureId': 'signatureId',
          '#updatedAt': 'updatedAt'
        },
        ExpressionAttributeValues: {
          ':signatureId': signatureId.getValue(),
          ':updatedAt': updatedConsent.getUpdatedAt().toISOString()
        }
      });

      return updatedConsent;
    } catch (err) {
      throw mapAwsError(err, 'ConsentRepository.linkWithSignature');
    }
  }

  /**
   * Checks if consent exists for signer and envelope
   * @param signerId - Signer ID
   * @param envelopeId - Envelope ID
   * @returns True if consent exists
   */
  async exists(signerId: SignerId, envelopeId: EnvelopeId): Promise<boolean> {
    try {
      const result = await this.ddb.query!({
        TableName: this.tableName,
        IndexName: 'GSI2',
        KeyConditionExpression: '#gsi2pk = :gsi2pk',
        FilterExpression: '#envelopeId = :envelopeId',
        ExpressionAttributeNames: {
          '#gsi2pk': 'gsi2pk',
          '#envelopeId': 'envelopeId'
        },
        ExpressionAttributeValues: {
          ':gsi2pk': ConsentKeyBuilders.buildSignerGsi2Key(signerId.getValue(), '').gsi2pk,
          ':envelopeId': envelopeId.getValue()
        },
        Limit: 1
      });

      return (result as any).Count || result.Items?.length || 0 > 0;
    } catch (err) {
      throw mapAwsError(err, 'ConsentRepository.exists');
    }
  }

  /**
   * Lists consents with pagination
   * @param options - Query options
   * @returns Paginated consent list
   */
  async list(options: ConsentQueryOptions = {}): Promise<ConsentListResult> {
    const { envelopeId, signerId, limit = 50, cursor, scanIndexForward = true } = options;

    try {
      let queryParams: any = {
        TableName: this.tableName,
        Limit: Math.min(limit, 100),
        ScanIndexForward: scanIndexForward
      };

      if (envelopeId) {
        queryParams.IndexName = 'GSI1';
        queryParams.KeyConditionExpression = '#gsi1pk = :gsi1pk';
        queryParams.ExpressionAttributeNames = { '#gsi1pk': 'gsi1pk' };
        queryParams.ExpressionAttributeValues = {
          ':gsi1pk': ConsentKeyBuilders.buildEnvelopeGsi1Key(envelopeId, '').gsi1pk
        };
      } else if (signerId) {
        queryParams.IndexName = 'GSI2';
        queryParams.KeyConditionExpression = '#gsi2pk = :gsi2pk';
        queryParams.ExpressionAttributeNames = { '#gsi2pk': 'gsi2pk' };
        queryParams.ExpressionAttributeValues = {
          ':gsi2pk': ConsentKeyBuilders.buildSignerGsi2Key(signerId, '').gsi2pk
        };
      } else {
        throw new Error('Either envelopeId or signerId must be provided');
      }

      if (cursor) {
        queryParams.ExclusiveStartKey = JSON.parse(Buffer.from(cursor, 'base64').toString());
      }

      const result = await this.ddb.query!(queryParams);
      const items = (result.Items ?? []) as Array<Record<string, unknown>>;
      const consents = items.filter(isConsentDdbItem).map(item => consentFromDdbItem(item as any));

      return {
        items: consents,
        cursor: result.LastEvaluatedKey ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64') : undefined,
        hasMore: !!result.LastEvaluatedKey
      };
    } catch (err) {
      throw mapAwsError(err, 'ConsentRepository.list');
    }
  }

  /**
   * Counts consents by envelope
   * @param envelopeId - Envelope ID
   * @returns Count result
   */
  async countByEnvelope(envelopeId: EnvelopeId): Promise<ConsentCountResult> {
    try {
      const result = await this.ddb.query!({
        TableName: this.tableName,
        IndexName: 'GSI1',
        KeyConditionExpression: '#gsi1pk = :gsi1pk',
        ExpressionAttributeNames: {
          '#gsi1pk': 'gsi1pk'
        },
        ExpressionAttributeValues: {
          ':gsi1pk': ConsentKeyBuilders.buildEnvelopeGsi1Key(envelopeId.getValue(), '').gsi1pk
        }
      });

      return {
        count: (result as any).Count || result.Items?.length || 0,
        envelopeId: envelopeId.getValue()
      };
    } catch (err) {
      throw mapAwsError(err, 'ConsentRepository.countByEnvelope');
    }
  }

  /**
   * Counts consents by signer
   * @param signerId - Signer ID
   * @returns Count result
   */
  async countBySigner(signerId: SignerId): Promise<ConsentCountResult> {
    try {
      const result = await this.ddb.query!({
        TableName: this.tableName,
        IndexName: 'GSI2',
        KeyConditionExpression: '#gsi2pk = :gsi2pk',
        ExpressionAttributeNames: {
          '#gsi2pk': 'gsi2pk'
        },
        ExpressionAttributeValues: {
          ':gsi2pk': ConsentKeyBuilders.buildSignerGsi2Key(signerId.getValue(), '').gsi2pk
        }
      });

      return {
        count: (result as any).Count || result.Items?.length || 0,
        signerId: signerId.getValue()
      };
    } catch (err) {
      throw mapAwsError(err, 'ConsentRepository.countBySigner');
    }
  }

  /**
   * Deletes a consent record
   * @param consentId - Consent ID
   */
  async delete(consentId: ConsentId): Promise<void> {
    try {
      await this.ddb.delete({
        TableName: this.tableName,
        Key: ConsentKeyBuilders.buildPrimaryKey(consentId.getValue())
      });
    } catch (err) {
      throw mapAwsError(err, 'ConsentRepository.delete');
    }
  }
}