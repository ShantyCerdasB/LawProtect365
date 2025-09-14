/**
 * @fileoverview SignatureRepository - Repository for signature data access
 * @summary Provides data access operations for signature entities
 * @description This repository handles all database operations for signatures
 * including CRUD operations, queries, and data persistence.
 */

import { DdbClientLike, mapAwsError, ConflictError, ErrorCodes, decodeCursor, encodeCursor, NotFoundError, requireUpdate } from '@lawprotect/shared-ts';
import { requireQuery } from '@lawprotect/shared-ts';

import { Signature } from '../domain/entities/Signature';
import { SignatureId } from '../domain/value-objects/SignatureId';
import { CreateSignatureRequest } from '../domain/types/signature/CreateSignatureRequest';
import { UpdateSignatureRequest } from '../domain/types/signature/UpdateSignatureRequest';
import {
  signatureDdbMapper,
  createSignatureFromRequest,
  isSignatureDdbItem,
  SignatureKeyBuilders,
  type SignatureListResult,
  type SignatureListCursorPayload
} from '../domain/types/infrastructure/signature';
import { DdbSortOrder } from '../domain/types/infrastructure/common';

/**
 * SignatureRepository implementation for DynamoDB
 * 
 * Provides CRUD operations and querying capabilities for signatures
 * using single-table pattern with multiple GSI for efficient querying.
 */
export class SignatureRepository {
  private readonly envelopeGsi1Name: string;
  private readonly signerGsi2Name: string;
  private readonly statusGsi3Name: string;

  /**
   * Creates a new SignatureRepository instance
   * @param tableName - DynamoDB table name
   * @param ddb - DynamoDB client instance
   * @param options - Optional configuration for GSI names
   */
  constructor(
    private readonly tableName: string,
    private readonly ddb: DdbClientLike,
    options?: {
      readonly envelopeGsi1Name?: string;
      readonly signerGsi2Name?: string;
      readonly statusGsi3Name?: string;
    }
  ) {
    this.envelopeGsi1Name = options?.envelopeGsi1Name || 'gsi1';
    this.signerGsi2Name = options?.signerGsi2Name || 'gsi2';
    this.statusGsi3Name = options?.statusGsi3Name || 'gsi3';
  }

  /**
   * Creates a new signature
   * @param request - The create signature request
   * @returns The created signature
   * @throws {ConflictError} When signature already exists
   */
  async create(request: CreateSignatureRequest): Promise<Signature> {
    const signature = createSignatureFromRequest({
      id: request.id,
      envelopeId: request.envelopeId.getValue(),
      signerId: request.signerId.getValue(),
      documentHash: request.documentHash,
      signatureHash: request.signatureHash,
      s3Key: request.s3Key,
      kmsKeyId: request.kmsKeyId,
      algorithm: request.algorithm,
      timestamp: request.timestamp,
      status: request.status,
      reason: request.reason,
      location: request.location,
      certificateInfo: request.certificateInfo,
      ipAddress: request.ipAddress,
      userAgent: request.userAgent
    });
    const item = signatureDdbMapper.toDTO(signature);

    try {
      await this.ddb.put({
        TableName: this.tableName,
        Item: item,
        ConditionExpression: 'attribute_not_exists(pk)'
      });

      return signature;
    } catch (err: any) {
      if (err.name === 'ConditionalCheckFailedException') {
        throw new ConflictError(
          `Signature with ID ${request.id.getValue()} already exists`,
          ErrorCodes.COMMON_CONFLICT
        );
      }
      throw mapAwsError(err, 'SignatureRepository.create');
    }
  }

  /**
   * Retrieves a signature by ID
   * @param id - The signature ID
   * @returns The signature or null if not found
   */
  async getById(id: SignatureId): Promise<Signature | null> {
    const { pk, sk } = SignatureKeyBuilders.buildPrimaryKey(id.getValue());

    try {
      const result = await this.ddb.get({
        TableName: this.tableName,
        Key: { pk, sk }
      });

      if (!result.Item) {
        return null;
      }

      if (!isSignatureDdbItem(result.Item)) {
        throw new Error('Invalid signature item structure');
      }

      return signatureDdbMapper.fromDTO(result.Item);
    } catch (err: any) {
      throw mapAwsError(err, 'SignatureRepository.getById');
    }
  }

  /**
   * Updates a signature
   * @param id - The signature ID
   * @param request - The update request
   * @returns The updated signature
   * @throws {NotFoundError} When signature is not found
   */
  async update(id: SignatureId, request: UpdateSignatureRequest): Promise<Signature> {
    const { pk, sk } = SignatureKeyBuilders.buildPrimaryKey(id.getValue());

    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    if (request.status !== undefined) {
      updateExpressions.push('#status = :status');
      expressionAttributeNames['#status'] = 'status';
      expressionAttributeValues[':status'] = request.status;

      // Update GSI3 key if status changed
      updateExpressions.push('gsi3pk = :gsi3pk, gsi3sk = :gsi3sk');
      const gsi3Key = SignatureKeyBuilders.buildGsi3Key(request.status, id.getValue());
      expressionAttributeValues[':gsi3pk'] = gsi3Key.gsi3pk;
      expressionAttributeValues[':gsi3sk'] = gsi3Key.gsi3sk;
    }

    if (request.metadata) {
      if (request.metadata.reason !== undefined) {
        updateExpressions.push('#reason = :reason');
        expressionAttributeNames['#reason'] = 'reason';
        expressionAttributeValues[':reason'] = request.metadata.reason;
      }

      if (request.metadata.location !== undefined) {
        updateExpressions.push('#location = :location');
        expressionAttributeNames['#location'] = 'location';
        expressionAttributeValues[':location'] = request.metadata.location;
      }

      if (request.metadata.certificateInfo !== undefined) {
        updateExpressions.push('certificateInfo = :certificateInfo');
        expressionAttributeValues[':certificateInfo'] = {
          issuer: request.metadata.certificateInfo.issuer,
          subject: request.metadata.certificateInfo.subject,
          validFrom: request.metadata.certificateInfo.validFrom.toISOString(),
          validTo: request.metadata.certificateInfo.validTo.toISOString(),
          certificateHash: request.metadata.certificateInfo.certificateHash
        };
      }

      if (request.metadata.ipAddress !== undefined) {
        updateExpressions.push('ipAddress = :ipAddress');
        expressionAttributeValues[':ipAddress'] = request.metadata.ipAddress;
      }

      if (request.metadata.userAgent !== undefined) {
        updateExpressions.push('userAgent = :userAgent');
        expressionAttributeValues[':userAgent'] = request.metadata.userAgent;
      }
    }

    updateExpressions.push('updatedAt = :updatedAt');
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    try {
      requireUpdate(this.ddb);
      const result = await this.ddb.update({
        TableName: this.tableName,
        Key: { pk, sk },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ...(Object.keys(expressionAttributeNames).length > 0 ? { ExpressionAttributeNames: expressionAttributeNames } : {}),
        ExpressionAttributeValues: expressionAttributeValues,
        ConditionExpression: 'attribute_exists(pk)',
        ReturnValues: 'ALL_NEW'
      });

      if (!result.Attributes || !isSignatureDdbItem(result.Attributes)) {
        throw new Error('Invalid signature item structure');
      }

      return signatureDdbMapper.fromDTO(result.Attributes);
    } catch (err: any) {
      if (err.name === 'ConditionalCheckFailedException') {
        throw new NotFoundError(
          `Signature with ID ${id.getValue()} not found`,
          ErrorCodes.COMMON_NOT_FOUND
        );
      }
      throw mapAwsError(err, 'SignatureRepository.update');
    }
  }

  /**
   * Deletes a signature
   * @param id - The signature ID
   * @throws {NotFoundError} When signature is not found
   */
  async delete(id: SignatureId): Promise<void> {
    const { pk, sk } = SignatureKeyBuilders.buildPrimaryKey(id.getValue());

    try {
      await this.ddb.delete({
        TableName: this.tableName,
        Key: { pk, sk },
        ConditionExpression: 'attribute_exists(pk)'
      });
    } catch (err: any) {
      if (err.name === 'ConditionalCheckFailedException') {
        throw new NotFoundError(
          `Signature with ID ${id.getValue()} not found`,
          ErrorCodes.COMMON_NOT_FOUND
        );
      }
      throw mapAwsError(err, 'SignatureRepository.delete');
    }
  }

  /**
   * Checks if a signature exists
   * @param id - The signature ID
   * @returns True if signature exists, false otherwise
   */
  async exists(id: SignatureId): Promise<boolean> {
    const { pk, sk } = SignatureKeyBuilders.buildPrimaryKey(id.getValue());

    try {
      const result = await this.ddb.get({
        TableName: this.tableName,
        Key: { pk, sk }
      });

      return !!result.Item;
    } catch (err: any) {
      throw mapAwsError(err, 'SignatureRepository.exists');
    }
  }

  /**
   * Retrieves signatures by envelope ID
   * @param envelopeId - The envelope ID
   * @param limit - Maximum number of signatures to return
   * @param cursor - Pagination cursor
   * @param sortOrder - Sort order for results
   * @returns List of signatures with pagination info
   */
  async getByEnvelope(
    envelopeId: string,
    limit: number = 25,
    cursor?: string,
    sortOrder: DdbSortOrder = DdbSortOrder.DESC
  ): Promise<SignatureListResult> {
    const take = Math.max(1, Math.min(limit, 100)) + 1;
    const c = decodeCursor<SignatureListCursorPayload>(cursor);

    requireQuery(this.ddb);

    try {
      const result = await this.ddb.query({
        TableName: this.tableName,
        IndexName: this.envelopeGsi1Name,
        KeyConditionExpression: '#gsi1pk = :envelope' + (c ? ' AND #gsi1sk > :after' : ''),
        ExpressionAttributeNames: {
          '#gsi1pk': 'gsi1pk',
          '#gsi1sk': 'gsi1sk'
        },
        ExpressionAttributeValues: {
          ':envelope': `ENVELOPE#${envelopeId}`,
          ...(c ? { ':after': `SIGNATURE#${c.signatureId}` } : {})
        },
        Limit: take,
        ScanIndexForward: sortOrder === DdbSortOrder.ASC
      });

      const items = (result.Items || []) as any[];
      const signatures = items
        .filter(item => isSignatureDdbItem(item))
        .map(item => signatureDdbMapper.fromDTO(item));

      const hasMore = signatures.length === take;
      const resultItems = signatures.slice(0, take - 1);

      const last = resultItems.at(-1);
      const nextCursor = hasMore && last
        ? encodeCursor({
            signatureId: last.getId().getValue(),
            timestamp: last.getTimestamp().toISOString()
          })
        : undefined;

      return {
        items: resultItems.map(s => signatureDdbMapper.toDTO(s)),
        nextCursor,
        hasMore
      };
    } catch (err: any) {
      throw mapAwsError(err, 'SignatureRepository.getByEnvelope');
    }
  }

  /**
   * Retrieves signatures by signer ID
   * @param signerId - The signer ID
   * @param limit - Maximum number of signatures to return
   * @param cursor - Pagination cursor
   * @param sortOrder - Sort order for results
   * @returns List of signatures with pagination info
   */
  async getBySigner(
    signerId: string,
    limit: number = 25,
    cursor?: string,
    sortOrder: DdbSortOrder = DdbSortOrder.DESC
  ): Promise<SignatureListResult> {
    const take = Math.max(1, Math.min(limit, 100)) + 1;
    const c = decodeCursor<SignatureListCursorPayload>(cursor);

    requireQuery(this.ddb);

    try {
      const result = await this.ddb.query({
        TableName: this.tableName,
        IndexName: this.signerGsi2Name,
        KeyConditionExpression: '#gsi2pk = :signer' + (c ? ' AND #gsi2sk > :after' : ''),
        ExpressionAttributeNames: {
          '#gsi2pk': 'gsi2pk',
          '#gsi2sk': 'gsi2sk'
        },
        ExpressionAttributeValues: {
          ':signer': `SIGNER#${signerId}`,
          ...(c ? { ':after': `SIGNATURE#${c.signatureId}` } : {})
        },
        Limit: take,
        ScanIndexForward: sortOrder === DdbSortOrder.ASC
      });

      const items = (result.Items || []) as any[];
      const signatures = items
        .filter(item => isSignatureDdbItem(item))
        .map(item => signatureDdbMapper.fromDTO(item));

      const hasMore = signatures.length === take;
      const resultItems = signatures.slice(0, take - 1);

      const last = resultItems.at(-1);
      const nextCursor = hasMore && last
        ? encodeCursor({
            signatureId: last.getId().getValue(),
            timestamp: last.getTimestamp().toISOString()
          })
        : undefined;

      return {
        items: resultItems.map(s => signatureDdbMapper.toDTO(s)),
        nextCursor,
        hasMore
      };
    } catch (err: any) {
      throw mapAwsError(err, 'SignatureRepository.getBySigner');
    }
  }

  /**
   * Retrieves signatures by status
   * @param status - The signature status
   * @param limit - Maximum number of signatures to return
   * @param cursor - Pagination cursor
   * @param sortOrder - Sort order for results
   * @returns List of signatures with pagination info
   */
  async getByStatus(
    status: string,
    limit: number = 25,
    cursor?: string,
    sortOrder: DdbSortOrder = DdbSortOrder.DESC
  ): Promise<SignatureListResult> {
    const take = Math.max(1, Math.min(limit, 100)) + 1;
    const c = decodeCursor<SignatureListCursorPayload>(cursor);

    requireQuery(this.ddb);

    try {
      const result = await this.ddb.query({
        TableName: this.tableName,
        IndexName: this.statusGsi3Name,
        KeyConditionExpression: '#gsi3pk = :status' + (c ? ' AND #gsi3sk > :after' : ''),
        ExpressionAttributeNames: {
          '#gsi3pk': 'gsi3pk',
          '#gsi3sk': 'gsi3sk'
        },
        ExpressionAttributeValues: {
          ':status': `STATUS#${status}`,
          ...(c ? { ':after': `SIGNATURE#${c.signatureId}` } : {})
        },
        Limit: take,
        ScanIndexForward: sortOrder === DdbSortOrder.ASC
      });

      const items = (result.Items || []) as any[];
      const signatures = items
        .filter(item => isSignatureDdbItem(item))
        .map(item => signatureDdbMapper.fromDTO(item));

      const hasMore = signatures.length === take;
      const resultItems = signatures.slice(0, take - 1);

      const last = resultItems.at(-1);
      const nextCursor = hasMore && last
        ? encodeCursor({
            signatureId: last.getId().getValue(),
            timestamp: last.getTimestamp().toISOString()
          })
        : undefined;

      return {
        items: resultItems.map(s => signatureDdbMapper.toDTO(s)),
        nextCursor,
        hasMore
      };
    } catch (err: any) {
      throw mapAwsError(err, 'SignatureRepository.getByStatus');
    }
  }

  /**
   * Counts signatures by envelope
   * @param envelopeId - The envelope ID
   * @returns Number of signatures for the envelope
   */
  async countByEnvelope(envelopeId: string): Promise<number> {
    requireQuery(this.ddb);

    try {
      const result = await this.ddb.query({
        TableName: this.tableName,
        IndexName: this.envelopeGsi1Name,
        KeyConditionExpression: '#gsi1pk = :envelope',
        ExpressionAttributeNames: {
          '#gsi1pk': 'gsi1pk'
        },
        ExpressionAttributeValues: {
          ':envelope': `ENVELOPE#${envelopeId}`
        }
      });

      return (result as any).Count || result.Items?.length || 0;
    } catch (err: any) {
      throw mapAwsError(err, 'SignatureRepository.countByEnvelope');
    }
  }

  /**
   * Counts signatures by signer
   * @param signerId - The signer ID
   * @returns Number of signatures for the signer
   */
  async countBySigner(signerId: string): Promise<number> {
    requireQuery(this.ddb);

    try {
      const result = await this.ddb.query({
        TableName: this.tableName,
        IndexName: this.signerGsi2Name,
        KeyConditionExpression: '#gsi2pk = :signer',
        ExpressionAttributeNames: {
          '#gsi2pk': 'gsi2pk'
        },
        ExpressionAttributeValues: {
          ':signer': `SIGNER#${signerId}`
        }
      });

      return (result as any).Count || result.Items?.length || 0;
    } catch (err: any) {
      throw mapAwsError(err, 'SignatureRepository.countBySigner');
    }
  }
}
