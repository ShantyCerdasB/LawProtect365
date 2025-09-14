/**
 * @fileoverview SignerRepository - Repository for signer data access
 * @summary Provides data access operations for signer entities
 * @description This repository handles all database operations for signers
 * including CRUD operations, queries, and data persistence.
 */

import { DdbClientLike, mapAwsError, ConflictError, ErrorCodes, decodeCursor, encodeCursor, NotFoundError, requireUpdate } from '@lawprotect/shared-ts';
import { requireQuery } from '@lawprotect/shared-ts';

import { Signer } from '../domain/entities/Signer';
import { SignerId } from '../domain/value-objects/SignerId';
import { CreateSignerDomainRequest } from '../domain/types/signer/CreateSignerRequest';
import { UpdateSignerDomainRequest } from '../domain/types/signer/UpdateSignerRequest';
import {
  signerDdbMapper,
  createSignerFromRequest,
  isSignerDdbItem,
  SignerKeyBuilders,
  type SignerListResult,
  type SignerListCursorPayload
} from '../domain/types/infrastructure/signer';
import { DdbSortOrder } from '../domain/types/infrastructure/common';

/**
 * SignerRepository implementation for DynamoDB
 * 
 * Provides CRUD operations and querying capabilities for signers
 * using single-table pattern with multiple GSI for efficient querying.
 */
export class SignerRepository {
  private readonly envelopeGsi1Name: string;
  private readonly emailGsi2Name: string;
  private readonly statusGsi3Name: string;
  private readonly tokenGsi4Name: string;

  /**
   * Creates a new SignerRepository instance
   * @param tableName - DynamoDB table name
   * @param ddb - DynamoDB client instance
   * @param options - Optional configuration for GSI names
   */
  constructor(
    private readonly tableName: string,
    private readonly ddb: DdbClientLike,
    options?: {
      readonly envelopeGsi1Name?: string;
      readonly emailGsi2Name?: string;
      readonly statusGsi3Name?: string;
      readonly tokenGsi4Name?: string;
    }
  ) {
    this.envelopeGsi1Name = options?.envelopeGsi1Name || 'gsi1';
    this.emailGsi2Name = options?.emailGsi2Name || 'gsi2';
    this.statusGsi3Name = options?.statusGsi3Name || 'gsi3';
    this.tokenGsi4Name = options?.tokenGsi4Name || 'gsi4';
  }

  /**
   * Creates a new signer
   * @param request - The create signer request
   * @returns The created signer
   * @throws {ConflictError} When signer already exists
   */
  async create(request: CreateSignerDomainRequest): Promise<Signer> {
    const signer = createSignerFromRequest({
      id: request.id,
      envelopeId: request.envelopeId.getValue(),
      email: request.email.getValue(),
      fullName: request.fullName,
      status: request.status,
      order: request.order,
      signedAt: request.signedAt,
      declinedAt: request.declinedAt,
      invitationToken: request.invitationToken,
      metadata: request.metadata
    });
    const item = signerDdbMapper.toDTO(signer);

    try {
      await this.ddb.put({
        TableName: this.tableName,
        Item: item,
        ConditionExpression: 'attribute_not_exists(pk)'
      });

      return signer;
    } catch (err: any) {
      if (err.name === 'ConditionalCheckFailedException') {
        throw new ConflictError(
          `Signer with ID ${request.id.getValue()} already exists`,
          ErrorCodes.COMMON_CONFLICT
        );
      }
      throw mapAwsError(err, 'SignerRepository.create');
    }
  }

  /**
   * Retrieves a signer by ID
   * @param id - The signer ID
   * @returns The signer or null if not found
   */
  async getById(id: SignerId): Promise<Signer | null> {
    const { pk, sk } = SignerKeyBuilders.buildPrimaryKey(id.getValue());

    try {
      const result = await this.ddb.get({
        TableName: this.tableName,
        Key: { pk, sk }
      });

      if (!result.Item) {
        return null;
      }

      if (!isSignerDdbItem(result.Item)) {
        throw new Error('Invalid signer item structure');
      }

      return signerDdbMapper.fromDTO(result.Item);
    } catch (err: any) {
      throw mapAwsError(err, 'SignerRepository.getById');
    }
  }

  /**
   * Updates a signer
   * @param id - The signer ID
   * @param request - The update request
   * @returns The updated signer
   * @throws {NotFoundError} When signer is not found
   */
  async update(id: SignerId, request: UpdateSignerDomainRequest): Promise<Signer> {
    const { pk, sk } = SignerKeyBuilders.buildPrimaryKey(id.getValue());

    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    if (request.status !== undefined) {
      updateExpressions.push('#status = :status');
      expressionAttributeNames['#status'] = 'status';
      expressionAttributeValues[':status'] = request.status;

      // Update GSI3 key if status changed
      updateExpressions.push('gsi3pk = :gsi3pk, gsi3sk = :gsi3sk');
      const gsi3Key = SignerKeyBuilders.buildGsi3Key(request.status, id.getValue());
      expressionAttributeValues[':gsi3pk'] = gsi3Key.gsi3pk;
      expressionAttributeValues[':gsi3sk'] = gsi3Key.gsi3sk;
    }

    if (request.signedAt !== undefined) {
      updateExpressions.push('signedAt = :signedAt');
      expressionAttributeValues[':signedAt'] = request.signedAt.toISOString();
    }

    if (request.declinedAt !== undefined) {
      updateExpressions.push('declinedAt = :declinedAt');
      expressionAttributeValues[':declinedAt'] = request.declinedAt.toISOString();
    }

    if (request.metadata) {
      if (request.metadata.ipAddress !== undefined) {
        updateExpressions.push('ipAddress = :ipAddress');
        expressionAttributeValues[':ipAddress'] = request.metadata.ipAddress;
      }

      if (request.metadata.userAgent !== undefined) {
        updateExpressions.push('userAgent = :userAgent');
        expressionAttributeValues[':userAgent'] = request.metadata.userAgent;
      }

      if (request.metadata.consentGiven !== undefined) {
        updateExpressions.push('consentGiven = :consentGiven');
        expressionAttributeValues[':consentGiven'] = request.metadata.consentGiven;
      }

      if (request.metadata.consentTimestamp !== undefined) {
        updateExpressions.push('consentTimestamp = :consentTimestamp');
        expressionAttributeValues[':consentTimestamp'] = request.metadata.consentTimestamp.toISOString();
      }

      if (request.metadata.declineReason !== undefined) {
        updateExpressions.push('declineReason = :declineReason');
        expressionAttributeValues[':declineReason'] = request.metadata.declineReason;
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

      if (!result.Attributes || !isSignerDdbItem(result.Attributes)) {
        throw new Error('Invalid signer item structure');
      }

      return signerDdbMapper.fromDTO(result.Attributes);
    } catch (err: any) {
      if (err.name === 'ConditionalCheckFailedException') {
        throw new NotFoundError(
          `Signer with ID ${id.getValue()} not found`,
          ErrorCodes.COMMON_NOT_FOUND
        );
      }
      throw mapAwsError(err, 'SignerRepository.update');
    }
  }

  /**
   * Deletes a signer
   * @param id - The signer ID
   * @throws {NotFoundError} When signer is not found
   */
  async delete(id: SignerId): Promise<void> {
    const { pk, sk } = SignerKeyBuilders.buildPrimaryKey(id.getValue());

    try {
      await this.ddb.delete({
        TableName: this.tableName,
        Key: { pk, sk },
        ConditionExpression: 'attribute_exists(pk)'
      });
    } catch (err: any) {
      if (err.name === 'ConditionalCheckFailedException') {
        throw new NotFoundError(
          `Signer with ID ${id.getValue()} not found`,
          ErrorCodes.COMMON_NOT_FOUND
        );
      }
      throw mapAwsError(err, 'SignerRepository.delete');
    }
  }

  /**
   * Checks if a signer exists
   * @param id - The signer ID
   * @returns True if signer exists, false otherwise
   */
  async exists(id: SignerId): Promise<boolean> {
    const { pk, sk } = SignerKeyBuilders.buildPrimaryKey(id.getValue());

    try {
      const result = await this.ddb.get({
        TableName: this.tableName,
        Key: { pk, sk }
      });

      return !!result.Item;
    } catch (err: any) {
      throw mapAwsError(err, 'SignerRepository.exists');
    }
  }

  /**
   * Retrieves signers by envelope ID
   * @param envelopeId - The envelope ID
   * @param limit - Maximum number of signers to return
   * @param cursor - Pagination cursor
   * @param sortOrder - Sort order for results
   * @returns List of signers with pagination info
   */
  async getByEnvelope(
    envelopeId: string,
    limit: number = 25,
    cursor?: string,
    sortOrder: DdbSortOrder = DdbSortOrder.ASC
  ): Promise<SignerListResult> {
    const take = Math.max(1, Math.min(limit, 100)) + 1;
    const c = decodeCursor<SignerListCursorPayload>(cursor);

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
          ...(c ? { ':after': `SIGNER#${c.signerId}` } : {})
        },
        Limit: take,
        ScanIndexForward: sortOrder === DdbSortOrder.ASC
      });

      const items = (result.Items || []) as any[];
      const signers = items
        .filter(item => isSignerDdbItem(item))
        .map(item => signerDdbMapper.fromDTO(item));

      const hasMore = signers.length === take;
      const resultItems = signers.slice(0, take - 1);

      const last = resultItems.at(-1);
      const nextCursor = hasMore && last
        ? encodeCursor({
            signerId: last.getId().getValue(),
            order: last.getOrder().toString()
          })
        : undefined;

      return {
        items: resultItems.map(s => signerDdbMapper.toDTO(s)),
        nextCursor,
        hasMore
      };
    } catch (err: any) {
      throw mapAwsError(err, 'SignerRepository.getByEnvelope');
    }
  }

  /**
   * Retrieves signer by email
   * @param email - The signer email
   * @returns The signer or null if not found
   */
  async getByEmail(email: string): Promise<Signer | null> {
    requireQuery(this.ddb);

    try {
      const result = await this.ddb.query({
        TableName: this.tableName,
        IndexName: this.emailGsi2Name,
        KeyConditionExpression: '#gsi2pk = :email',
        ExpressionAttributeNames: {
          '#gsi2pk': 'gsi2pk'
        },
        ExpressionAttributeValues: {
          ':email': `EMAIL#${email}`
        },
        Limit: 1
      });

      const items = (result.Items || []) as any[];
      if (items.length === 0) {
        return null;
      }

      const item = items[0];
      if (!isSignerDdbItem(item)) {
        throw new Error('Invalid signer item structure');
      }

      return signerDdbMapper.fromDTO(item);
    } catch (err: any) {
      throw mapAwsError(err, 'SignerRepository.getByEmail');
    }
  }

  /**
   * Retrieves signers by status
   * @param status - The signer status
   * @param limit - Maximum number of signers to return
   * @param cursor - Pagination cursor
   * @param sortOrder - Sort order for results
   * @returns List of signers with pagination info
   */
  async getByStatus(
    status: string,
    limit: number = 25,
    cursor?: string,
    sortOrder: DdbSortOrder = DdbSortOrder.DESC
  ): Promise<SignerListResult> {
    const take = Math.max(1, Math.min(limit, 100)) + 1;
    const c = decodeCursor<SignerListCursorPayload>(cursor);

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
          ...(c ? { ':after': `SIGNER#${c.signerId}` } : {})
        },
        Limit: take,
        ScanIndexForward: sortOrder === DdbSortOrder.ASC
      });

      const items = (result.Items || []) as any[];
      const signers = items
        .filter(item => isSignerDdbItem(item))
        .map(item => signerDdbMapper.fromDTO(item));

      const hasMore = signers.length === take;
      const resultItems = signers.slice(0, take - 1);

      const last = resultItems.at(-1);
      const nextCursor = hasMore && last
        ? encodeCursor({
            signerId: last.getId().getValue(),
            order: last.getOrder().toString()
          })
        : undefined;

      return {
        items: resultItems.map(s => signerDdbMapper.toDTO(s)),
        nextCursor,
        hasMore
      };
    } catch (err: any) {
      throw mapAwsError(err, 'SignerRepository.getByStatus');
    }
  }

  /**
   * Retrieves signer by invitation token
   * @param invitationToken - The invitation token
   * @returns The signer or null if not found
   */
  async getByInvitationToken(invitationToken: string): Promise<Signer | null> {
    requireQuery(this.ddb);

    try {
      const result = await this.ddb.query({
        TableName: this.tableName,
        IndexName: this.tokenGsi4Name,
        KeyConditionExpression: '#gsi4pk = :token',
        ExpressionAttributeNames: {
          '#gsi4pk': 'gsi4pk'
        },
        ExpressionAttributeValues: {
          ':token': `TOKEN#${invitationToken}`
        },
        Limit: 1
      });

      const items = (result.Items || []) as any[];
      if (items.length === 0) {
        return null;
      }

      const item = items[0];
      if (!isSignerDdbItem(item)) {
        throw new Error('Invalid signer item structure');
      }

      return signerDdbMapper.fromDTO(item);
    } catch (err: any) {
      throw mapAwsError(err, 'SignerRepository.getByInvitationToken');
    }
  }

  /**
   * Counts signers by envelope
   * @param envelopeId - The envelope ID
   * @returns Number of signers for the envelope
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
      throw mapAwsError(err, 'SignerRepository.countByEnvelope');
    }
  }

  /**
   * Counts signers by status
   * @param status - The signer status
   * @returns Number of signers with the status
   */
  async countByStatus(status: string): Promise<number> {
    requireQuery(this.ddb);

    try {
      const result = await this.ddb.query({
        TableName: this.tableName,
        IndexName: this.statusGsi3Name,
        KeyConditionExpression: '#gsi3pk = :status',
        ExpressionAttributeNames: {
          '#gsi3pk': 'gsi3pk'
        },
        ExpressionAttributeValues: {
          ':status': `STATUS#${status}`
        }
      });

      return (result as any).Count || result.Items?.length || 0;
    } catch (err: any) {
      throw mapAwsError(err, 'SignerRepository.countByStatus');
    }
  }
}
