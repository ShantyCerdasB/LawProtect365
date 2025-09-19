/**
 * @fileoverview SignerRepository - Repository for signer data access
 * @summary Provides data access operations for signer entities
 * @description This repository handles all database operations for signers
 * including CRUD operations, queries, and data persistence.
 */

import { DdbClientLike, mapAwsError, ConflictError, ErrorCodes, decodeCursor, NotFoundError, requireUpdate, BadRequestError } from '@lawprotect/shared-ts';

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
import { BaseRepository, type CursorPayload } from './BaseRepository';

/**
 * SignerRepository implementation for DynamoDB
 * 
 * Provides CRUD operations and querying capabilities for signers
 * using single-table pattern with multiple GSI for efficient querying.
 */
export class SignerRepository extends BaseRepository {
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
    tableName: string,
    ddb: DdbClientLike,
    options?: {
      readonly envelopeGsi1Name?: string;
      readonly emailGsi2Name?: string;
      readonly statusGsi3Name?: string;
      readonly tokenGsi4Name?: string;
    }
  ) {
    super(tableName, ddb);
    this.envelopeGsi1Name = options?.envelopeGsi1Name || 'gsi1';
    this.emailGsi2Name = options?.emailGsi2Name || 'gsi2';
    this.statusGsi3Name = options?.statusGsi3Name || 'gsi3';
    this.tokenGsi4Name = options?.tokenGsi4Name || 'gsi4';
  }

  /**
   * Builds the "after" value for cursor-based pagination
   */
  protected buildAfterValue(cursor: CursorPayload, gsiSkAttribute: string): string {
    if (gsiSkAttribute === 'gsi1sk' || gsiSkAttribute === 'gsi3sk') {
      return `SIGNER#${cursor.signerId}`;
    }
    throw new Error(`Unsupported GSI sort key attribute: ${gsiSkAttribute}`);
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
        throw new BadRequestError('Invalid signer item structure', 'INVALID_SIGNER_DATA');
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

    const updateData = this.buildUpdateData(id, request);
    const updateParams = this.buildUpdateParams(pk, sk, updateData);

    try {
      requireUpdate(this.ddb);
      const result = await this.ddb.update(updateParams);

      if (!result.Attributes || !isSignerDdbItem(result.Attributes)) {
        throw new BadRequestError('Invalid signer item structure', 'INVALID_SIGNER_DATA');
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
   * Builds update data from request
   */
  private buildUpdateData(id: SignerId, request: UpdateSignerDomainRequest) {
    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    this.addStatusUpdate(id, request, updateExpressions, expressionAttributeNames, expressionAttributeValues);
    this.addTimestampUpdates(request, updateExpressions, expressionAttributeValues);
    this.addMetadataUpdates(request, updateExpressions, expressionAttributeValues);
    this.addUpdatedAt(updateExpressions, expressionAttributeValues);

    return {
      updateExpressions,
      expressionAttributeNames,
      expressionAttributeValues
    };
  }

  /**
   * Adds status update if present
   */
  private addStatusUpdate(
    id: SignerId,
    request: UpdateSignerDomainRequest,
    updateExpressions: string[],
    expressionAttributeNames: Record<string, string>,
    expressionAttributeValues: Record<string, any>
  ): void {
    if (request.status === undefined) return;

    updateExpressions.push('#status = :status');
    expressionAttributeNames['#status'] = 'status';
    expressionAttributeValues[':status'] = request.status;

    // Update GSI3 key if status changed
    updateExpressions.push('gsi3pk = :gsi3pk, gsi3sk = :gsi3sk');
    const gsi3Key = SignerKeyBuilders.buildGsi3Key(request.status, id.getValue());
    expressionAttributeValues[':gsi3pk'] = gsi3Key.gsi3pk;
    expressionAttributeValues[':gsi3sk'] = gsi3Key.gsi3sk;
  }

  /**
   * Adds timestamp updates if present
   */
  private addTimestampUpdates(
    request: UpdateSignerDomainRequest,
    updateExpressions: string[],
    expressionAttributeValues: Record<string, any>
  ): void {
    if (request.signedAt !== undefined) {
      updateExpressions.push('signedAt = :signedAt');
      expressionAttributeValues[':signedAt'] = request.signedAt.toISOString();
    }

    if (request.declinedAt !== undefined) {
      updateExpressions.push('declinedAt = :declinedAt');
      expressionAttributeValues[':declinedAt'] = request.declinedAt.toISOString();
    }
  }

  /**
   * Adds metadata updates if present
   */
  private addMetadataUpdates(
    request: UpdateSignerDomainRequest,
    updateExpressions: string[],
    expressionAttributeValues: Record<string, any>
  ): void {
    if (!request.metadata) return;

    const metadataFields = [
      { field: 'ipAddress', value: request.metadata.ipAddress },
      { field: 'userAgent', value: request.metadata.userAgent },
      { field: 'consentGiven', value: request.metadata.consentGiven },
      { field: 'declineReason', value: request.metadata.declineReason }
    ];

    for (const { field, value } of metadataFields) {
      if (value !== undefined) {
        updateExpressions.push(`${field} = :${field}`);
        expressionAttributeValues[`:${field}`] = value;
      }
    }

    if (request.metadata.consentTimestamp !== undefined) {
      updateExpressions.push('consentTimestamp = :consentTimestamp');
      expressionAttributeValues[':consentTimestamp'] = request.metadata.consentTimestamp.toISOString();
    }
  }

  /**
   * Adds updatedAt timestamp
   */
  private addUpdatedAt(
    updateExpressions: string[],
    expressionAttributeValues: Record<string, any>
  ): void {
    updateExpressions.push('updatedAt = :updatedAt');
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();
  }

  /**
   * Builds DynamoDB update parameters
   */
  private buildUpdateParams(pk: string, sk: string, updateData: any) {
    return {
      TableName: this.tableName,
      Key: { pk, sk },
      UpdateExpression: `SET ${updateData.updateExpressions.join(', ')}`,
      ...(Object.keys(updateData.expressionAttributeNames).length > 0 ? { ExpressionAttributeNames: updateData.expressionAttributeNames } : {}),
      ExpressionAttributeValues: updateData.expressionAttributeValues,
      ConditionExpression: 'attribute_exists(pk)',
      ReturnValues: 'ALL_NEW' as const
    };
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
    const c = decodeCursor<SignerListCursorPayload>(cursor);
    
    return this.executePaginatedQuery(
      {
        tableName: this.tableName,
        indexName: this.envelopeGsi1Name,
        gsiPkAttribute: 'gsi1pk',
        gsiSkAttribute: 'gsi1sk',
        pkValue: `ENVELOPE#${envelopeId}`,
        cursor: c,
        limit,
        sortOrder,
        ddb: this.ddb
      },
      isSignerDdbItem,
      signerDdbMapper,
      (signer) => ({
        signerId: signer.getId().getValue(),
        order: signer.getOrder().toString()
      }),
      'SignerRepository.getByEnvelope'
    );
  }

  /**
   * Retrieves signer by email
   * @param email - The signer email
   * @returns The signer or null if not found
   */
  async getByEmail(email: string): Promise<Signer | null> {
    return this.executeSingleItemQuery(
      this.tableName,
      this.emailGsi2Name,
      'gsi2pk',
      `EMAIL#${email}`,
      this.ddb,
      isSignerDdbItem,
      signerDdbMapper,
      'SignerRepository.getByEmail'
    );
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
    const c = decodeCursor<SignerListCursorPayload>(cursor);
    
    return this.executePaginatedQuery(
      {
        tableName: this.tableName,
        indexName: this.statusGsi3Name,
        gsiPkAttribute: 'gsi3pk',
        gsiSkAttribute: 'gsi3sk',
        pkValue: `STATUS#${status}`,
        cursor: c,
        limit,
        sortOrder,
        ddb: this.ddb
      },
      isSignerDdbItem,
      signerDdbMapper,
      (signer) => ({
        signerId: signer.getId().getValue(),
        order: signer.getOrder().toString()
      }),
      'SignerRepository.getByStatus'
    );
  }

  /**
   * Retrieves signer by invitation token
   * @param invitationToken - The invitation token
   * @returns The signer or null if not found
   */
  async getByInvitationToken(invitationToken: string): Promise<Signer | null> {
    return this.executeSingleItemQuery(
      this.tableName,
      this.tokenGsi4Name,
      'gsi4pk',
      `TOKEN#${invitationToken}`,
      this.ddb,
      isSignerDdbItem,
      signerDdbMapper,
      'SignerRepository.getByInvitationToken'
    );
  }

  /**
   * Counts signers by envelope
   * @param envelopeId - The envelope ID
   * @returns Number of signers for the envelope
   */
  async countByEnvelope(envelopeId: string): Promise<number> {
    return this.executeCountQuery(
      this.tableName,
      this.envelopeGsi1Name,
      'gsi1pk',
      `ENVELOPE#${envelopeId}`,
      this.ddb,
      'SignerRepository.countByEnvelope'
    );
  }

  /**
   * Counts signers by status
   * @param status - The signer status
   * @returns Number of signers with the status
   */
  async countByStatus(status: string): Promise<number> {
    return this.executeCountQuery(
      this.tableName,
      this.statusGsi3Name,
      'gsi3pk',
      `STATUS#${status}`,
      this.ddb,
      'SignerRepository.countByStatus'
    );
  }
}
