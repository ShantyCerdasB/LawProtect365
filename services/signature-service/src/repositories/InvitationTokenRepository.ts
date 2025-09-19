/**
 * @fileoverview InvitationTokenRepository - Repository for invitation token data access
 * @summary Provides data access operations for invitation tokens
 * @description This repository handles all database operations for invitation tokens
 * including CRUD operations, queries, and data persistence.
 */

import { DdbClientLike, mapAwsError, ConflictError, NotFoundError, ErrorCodes, decodeCursor, requireUpdate, BadRequestError } from '@lawprotect/shared-ts';
import { InvitationToken } from '../domain/entities/InvitationToken';
import { InvitationTokenId } from '../domain/value-objects/InvitationTokenId';
import { CreateInvitationTokenDomainRequest, UpdateInvitationTokenDomainRequest } from '../domain/types/invitation-token';
import { InvitationTokenKeyBuilders, InvitationTokenListCursorPayload, InvitationTokenQueryParams } from '../domain/types/infrastructure/invitation-token/invitation-token-ddb-types';
import { invitationTokenDdbMapper, isInvitationTokenDdbItem } from '../domain/types/infrastructure/invitation-token/invitation-token-mappers';
import { BaseRepository } from './BaseRepository';
import { DdbSortOrder } from '../domain/types/infrastructure/common';

/**
 * InvitationTokenRepository
 * 
 * Repository for managing invitation token data access operations.
 * Handles CRUD operations, queries, and data persistence for invitation tokens.
 */
export class InvitationTokenRepository extends BaseRepository {
  private readonly signerGsi1Name: string;
  private readonly envelopeGsi2Name: string;
  private readonly expirationGsi3Name: string;

  constructor(
    tableName: string,
    ddb: DdbClientLike,
    options?: {
      readonly signerGsi1Name?: string;
      readonly envelopeGsi2Name?: string;
      readonly expirationGsi3Name?: string;
    }
  ) {
    super(tableName, ddb);
    this.signerGsi1Name = options?.signerGsi1Name || 'gsi1';
    this.envelopeGsi2Name = options?.envelopeGsi2Name || 'gsi2';
    this.expirationGsi3Name = options?.expirationGsi3Name || 'gsi3';
  }

  /**
   * Creates a new invitation token
   */
  async create(request: CreateInvitationTokenDomainRequest): Promise<InvitationToken> {
    const invitationToken = new InvitationToken(
      request.id,
      request.token,
      request.signerId,
      request.envelopeId,
      request.expiresAt,
      request.createdAt,
      undefined,
      request.metadata || {}
    );

    const ddbItem = invitationTokenDdbMapper.toDTO(invitationToken);

    try {
      await this.ddb.put({
        TableName: this.tableName,
        Item: ddbItem as any,
        ConditionExpression: 'attribute_not_exists(pk)'
      });

      return invitationToken;
    } catch (err: any) {
      if (err.name === 'ConditionalCheckFailedException') {
        throw new ConflictError(
          `Invitation token ${request.token} already exists`,
          ErrorCodes.COMMON_CONFLICT
        );
      }
      throw mapAwsError(err, 'InvitationTokenRepository.create');
    }
  }

  /**
   * Gets an invitation token by token string
   */
  async getByToken(token: string): Promise<InvitationToken | null> {
    const pk = InvitationTokenKeyBuilders.buildPk(token);
    const sk = InvitationTokenKeyBuilders.buildSk(token);

    try {
      const result = await this.ddb.get({
        TableName: this.tableName,
        Key: { pk, sk }
      });

      if (!result.Item || !isInvitationTokenDdbItem(result.Item)) {
        return null;
      }

      return invitationTokenDdbMapper.fromDTO(result.Item);
    } catch (err: any) {
      throw mapAwsError(err, 'InvitationTokenRepository.getByToken');
    }
  }

  /**
   * Gets an invitation token by ID
   */
  async getById(id: InvitationTokenId): Promise<InvitationToken | null> {
    // Since we don't have a direct ID to token mapping, we need to query by token
    // This assumes the token is part of the ID value
    return this.getByToken(id.getValue());
  }

  /**
   * Updates an invitation token
   */
  async update(token: string, request: UpdateInvitationTokenDomainRequest): Promise<InvitationToken> {
    const pk = InvitationTokenKeyBuilders.buildPk(token);
    const sk = InvitationTokenKeyBuilders.buildSk(token);

    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    if (request.usedAt !== undefined) {
      updateExpressions.push('#usedAt = :usedAt');
      expressionAttributeNames['#usedAt'] = 'usedAt';
      expressionAttributeValues[':usedAt'] = request.usedAt.toISOString();
    }

    if (request.metadata !== undefined) {
      updateExpressions.push('#metadata = :metadata');
      expressionAttributeNames['#metadata'] = 'metadata';
      expressionAttributeValues[':metadata'] = request.metadata;
    }

    if (updateExpressions.length === 0) {
      throw new BadRequestError('No fields to update', 'NO_FIELDS_TO_UPDATE');
    }

    requireUpdate(this.ddb);
    try {
      const result = await this.ddb.update!({
        TableName: this.tableName,
        Key: { pk, sk },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW'
      });

      if (!result.Attributes || !isInvitationTokenDdbItem(result.Attributes)) {
        throw new NotFoundError('Invitation token not found');
      }

      return invitationTokenDdbMapper.fromDTO(result.Attributes);
    } catch (err: any) {
      if (err.name === 'ConditionalCheckFailedException') {
        throw new NotFoundError('Invitation token not found');
      }
      throw mapAwsError(err, 'InvitationTokenRepository.update');
    }
  }

  /**
   * Deletes an invitation token
   */
  async delete(token: string): Promise<void> {
    const pk = InvitationTokenKeyBuilders.buildPk(token);
    const sk = InvitationTokenKeyBuilders.buildSk(token);

    try {
      await this.ddb.delete({
        TableName: this.tableName,
        Key: { pk, sk }
      });
    } catch (err: any) {
      throw mapAwsError(err, 'InvitationTokenRepository.delete');
    }
  }

  /**
   * Checks if an invitation token exists
   */
  async exists(token: string): Promise<boolean> {
    const pk = InvitationTokenKeyBuilders.buildPk(token);
    const sk = InvitationTokenKeyBuilders.buildSk(token);

    try {
      const result = await this.ddb.get({
        TableName: this.tableName,
        Key: { pk, sk }
      });

      return !!result.Item;
    } catch (err: any) {
      throw mapAwsError(err, 'InvitationTokenRepository.exists');
    }
  }

  /**
   * Gets invitation tokens by signer ID
   */
  async getBySigner(signerId: string, params: InvitationTokenQueryParams = {}): Promise<{
    items: InvitationToken[];
    nextCursor?: string;
  }> {
    const gsi1pk = InvitationTokenKeyBuilders.buildGsi1Pk(signerId);
    const limit = params.limit || 20;
    const sortOrder = params.sortOrder || 'desc';
    const cursor = params.cursor ? decodeCursor<InvitationTokenListCursorPayload>(params.cursor) : undefined;

    return this.executeAdvancedPaginatedQuery(
      {
        tableName: this.tableName,
        indexName: this.signerGsi1Name,
        keyConditionExpression: '#gsi1pk = :gsi1pk',
        expressionAttributeNames: { '#gsi1pk': 'gsi1pk' },
        expressionAttributeValues: {
          ':gsi1pk': gsi1pk
        },
        cursor,
        limit,
        sortOrder: sortOrder === 'asc' ? DdbSortOrder.ASC : DdbSortOrder.DESC,
        ddb: this.ddb,
        exclusiveStartKeyBuilder: (cursor) => ({
          pk: InvitationTokenKeyBuilders.buildPk(cursor.token),
          sk: InvitationTokenKeyBuilders.buildSk(cursor.token),
          gsi1pk,
          gsi1sk: InvitationTokenKeyBuilders.buildGsi1Sk(cursor.token)
        })
      },
      isInvitationTokenDdbItem,
      invitationTokenDdbMapper,
      (token) => ({
        token: token.getToken(),
        expiresAt: token.getExpiresAt().toISOString()
      }),
      'InvitationTokenRepository.getBySigner'
    );
  }

  /**
   * Gets invitation tokens by envelope ID
   */
  async getByEnvelope(envelopeId: string, params: InvitationTokenQueryParams = {}): Promise<{
    items: InvitationToken[];
    nextCursor?: string;
  }> {
    const gsi2pk = InvitationTokenKeyBuilders.buildGsi2Pk(envelopeId);
    const limit = params.limit || 20;
    const sortOrder = params.sortOrder || 'desc';
    const cursor = params.cursor ? decodeCursor<InvitationTokenListCursorPayload>(params.cursor) : undefined;

    const result = await this.executeAdvancedPaginatedQuery(
      {
        tableName: this.tableName,
        indexName: this.envelopeGsi2Name,
        keyConditionExpression: '#gsi2pk = :gsi2pk',
        expressionAttributeNames: { '#gsi2pk': 'gsi2pk' },
        expressionAttributeValues: {
          ':gsi2pk': gsi2pk
        },
        cursor,
        limit,
        sortOrder: sortOrder === 'asc' ? DdbSortOrder.ASC : DdbSortOrder.DESC,
        ddb: this.ddb,
        exclusiveStartKeyBuilder: (cursor) => ({
          pk: InvitationTokenKeyBuilders.buildPk(cursor.token),
          sk: InvitationTokenKeyBuilders.buildSk(cursor.token),
          gsi2pk,
          gsi2sk: InvitationTokenKeyBuilders.buildGsi2Sk(cursor.token)
        })
      },
      isInvitationTokenDdbItem,
      invitationTokenDdbMapper,
      (token) => ({
        token: token.getToken(),
        expiresAt: token.getExpiresAt().toISOString()
      }),
      'InvitationTokenRepository.getByEnvelope'
    );

    // Convert DTOs back to domain entities for the service layer
    const entities = result.items.map(dto => invitationTokenDdbMapper.fromDTO(dto as any));
    
    return {
      items: entities,
      nextCursor: result.nextCursor
    };
  }

  /**
   * Gets expired invitation tokens
   */
  async getExpired(beforeDate: Date, params: InvitationTokenQueryParams = {}): Promise<{
    items: InvitationToken[];
    nextCursor?: string;
  }> {
    const gsi3pk = InvitationTokenKeyBuilders.buildGsi3Pk();
    const limit = params.limit || 20;
    const cursor = params.cursor ? decodeCursor<InvitationTokenListCursorPayload>(params.cursor) : undefined;

    return this.executeAdvancedPaginatedQuery(
      {
        tableName: this.tableName,
        indexName: this.expirationGsi3Name,
        keyConditionExpression: '#gsi3pk = :gsi3pk AND #gsi3sk < :expiresAt',
        expressionAttributeNames: { '#gsi3pk': 'gsi3pk', '#gsi3sk': 'gsi3sk' },
        expressionAttributeValues: {
          ':gsi3pk': gsi3pk,
          ':expiresAt': `EXPIRES_AT#${beforeDate.toISOString()}`
        },
        cursor,
        limit,
        sortOrder: DdbSortOrder.DESC,
        ddb: this.ddb,
        exclusiveStartKeyBuilder: (cursor) => ({
          pk: InvitationTokenKeyBuilders.buildPk(cursor.token),
          sk: InvitationTokenKeyBuilders.buildSk(cursor.token),
          gsi3pk,
          gsi3sk: InvitationTokenKeyBuilders.buildGsi3Sk(cursor.expiresAt, cursor.token)
        })
      },
      isInvitationTokenDdbItem,
      invitationTokenDdbMapper,
      (token) => ({
        token: token.getToken(),
        expiresAt: token.getExpiresAt().toISOString()
      }),
      'InvitationTokenRepository.getExpired'
    );
  }

  /**
   * Counts invitation tokens by signer
   */
  async countBySigner(signerId: string): Promise<number> {
    const gsi1pk = InvitationTokenKeyBuilders.buildGsi1Pk(signerId);
    return this.executeCountQuery(
      this.tableName,
      this.signerGsi1Name,
      'gsi1pk',
      gsi1pk,
      this.ddb,
      'InvitationTokenRepository.countBySigner'
    );
  }

  /**
   * Counts invitation tokens by envelope
   */
  async countByEnvelope(envelopeId: string): Promise<number> {
    const gsi2pk = InvitationTokenKeyBuilders.buildGsi2Pk(envelopeId);
    return this.executeCountQuery(
      this.tableName,
      this.envelopeGsi2Name,
      'gsi2pk',
      gsi2pk,
      this.ddb,
      'InvitationTokenRepository.countByEnvelope'
    );
  }
}
