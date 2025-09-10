/**
 * @file InvitationTokenRepositoryDdb.ts
 * @summary DynamoDB implementation of InvitationToken repository
 * @description Handles persistence of invitation tokens using DynamoDB
 */

import type { Repository, DdbClientLike } from "@lawprotect/shared-ts";
import { NotFoundError, mapAwsError, toDdbItem, BadRequestError, ErrorCodes } from "@lawprotect/shared-ts";
import type { InvitationToken, CreateInvitationTokenInput, UpdateInvitationTokenInput } from "../../domain/entities/InvitationToken";
import type { EnvelopeId } from "../../domain/value-objects/ids";
import {
  invitationTokenItemMapper,
  invitationTokenPk,
  invitationTokenSk,
  invitationTokenGsi1Pk,
  InvitationTokenKey
} from "../../domain/types/infrastructure/dynamodb";

/**
 * @summary DynamoDB repository for invitation tokens
 */
export class InvitationTokenRepositoryDdb implements Repository<InvitationToken, InvitationTokenKey, undefined> {
  constructor(
    private readonly tableName: string,
    private readonly ddb: DdbClientLike
  ) {}

  /**
   * @summary Create a new invitation token
   */
  async create(input: CreateInvitationTokenInput): Promise<InvitationToken> {
    const tokenId = this.generateTokenId();
    const token = this.generateSecureToken();
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + (input.expiresInDays || 30) * 24 * 60 * 60 * 1000).toISOString();

    const invitationToken: InvitationToken = {
      tokenId,
      token,
      envelopeId: input.envelopeId,
      partyId: input.partyId,
      email: input.email,
      name: input.name,
      role: input.role,
      invitedBy: input.invitedBy,
      invitedByName: input.invitedByName,
      status: "active",
      createdAt: now,
      expiresAt,
      message: input.message,
      signByDate: input.signByDate,
      signingOrder: input.signingOrder
    };

    try {
      await this.ddb.put({
        TableName: this.tableName,
        Item: toDdbItem(invitationTokenItemMapper.toDTO(invitationToken)),
        ConditionExpression: "attribute_not_exists(pk) AND attribute_not_exists(sk)"
      });
    } catch (error) {
      throw mapAwsError(error, "InvitationTokenRepositoryDdb.create");
    }

    return invitationToken;
  }

  /**
   * @summary Get invitation token by ID (requires envelopeId)
   */
  async getById(key: InvitationTokenKey & { envelopeId: EnvelopeId }): Promise<InvitationToken | null> {
    try {
      const res = await this.ddb.get({
        TableName: this.tableName,
        Key: {
          pk: invitationTokenPk(key.envelopeId),
          sk: invitationTokenSk(key.tokenId)
        }
      });

      return res.Item ? invitationTokenItemMapper.fromDTO(res.Item as any) : null;
    } catch (error) {
      throw mapAwsError(error, "InvitationTokenRepositoryDdb.getById");
    }
  }

  /**
   * @summary Get invitation token by token string
   */
  async getByToken(token: string): Promise<InvitationToken | null> {
    try {
      const result = await this.ddb.query!({
        TableName: this.tableName,
        IndexName: "gsi1",
        KeyConditionExpression: "gsi1pk = :gsi1pk",
        ExpressionAttributeValues: {
          ":gsi1pk": invitationTokenGsi1Pk(token)
        }
      });

      if (!result.Items || result.Items.length === 0) {
        return null;
      }

      return invitationTokenItemMapper.fromDTO(result.Items[0] as any);
    } catch (error) {
      throw mapAwsError(error, "InvitationTokenRepositoryDdb.getByToken");
    }
  }

  /**
   * @summary Get all tokens for an envelope
   */
  async getByEnvelope(envelopeId: EnvelopeId): Promise<InvitationToken[]> {
    try {
      const result = await this.ddb.query!({
        TableName: this.tableName,
        KeyConditionExpression: "pk = :pk AND begins_with(sk, :sk)",
        ExpressionAttributeValues: {
          ":pk": invitationTokenPk(envelopeId),
          ":sk": "TOKEN#"
        }
      });

      if (!result.Items) {
        return [];
      }

      return result.Items.map(item => invitationTokenItemMapper.fromDTO(item as any));
    } catch (error) {
      throw mapAwsError(error, "InvitationTokenRepositoryDdb.getByEnvelope");
    }
  }

  /**
   * @summary Update an invitation token
   */
  async update(key: InvitationTokenKey & { envelopeId: EnvelopeId }, input: UpdateInvitationTokenInput): Promise<InvitationToken> {
    const updateExpressions: string[] = [];
    const expressionAttributeValues: Record<string, any> = {};

    if (input.status !== undefined) {
      updateExpressions.push("#status = :status");
      expressionAttributeValues[":status"] = input.status;
    }

    if (input.usedAt !== undefined) {
      updateExpressions.push("usedAt = :usedAt");
      expressionAttributeValues[":usedAt"] = input.usedAt;
    }

    if (input.usedFromIp !== undefined) {
      updateExpressions.push("usedFromIp = :usedFromIp");
      expressionAttributeValues[":usedFromIp"] = input.usedFromIp;
    }

    if (input.usedWithUserAgent !== undefined) {
      updateExpressions.push("usedWithUserAgent = :usedWithUserAgent");
      expressionAttributeValues[":usedWithUserAgent"] = input.usedWithUserAgent;
    }

    if (updateExpressions.length === 0) {
      throw new BadRequestError("No fields to update", ErrorCodes.COMMON_BAD_REQUEST);
    }

    try {
      const result = await this.ddb.update!({
        TableName: this.tableName,
        Key: {
          pk: invitationTokenPk(key.envelopeId),
          sk: invitationTokenSk(key.tokenId)
        },
        UpdateExpression: `SET ${updateExpressions.join(", ")}`,
        ExpressionAttributeNames: {
          "#status": "status"
        },
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: "ALL_NEW"
      });

      if (!result.Attributes) {
        throw new NotFoundError("Invitation token not found", ErrorCodes.COMMON_NOT_FOUND);
      }

      return invitationTokenItemMapper.fromDTO(result.Attributes as any);
    } catch (error) {
      throw mapAwsError(error, "InvitationTokenRepositoryDdb.update");
    }
  }

  /**
   * @summary Delete an invitation token
   */
  async delete(key: InvitationTokenKey & { envelopeId: EnvelopeId }): Promise<void> {
    try {
      await this.ddb.delete!({
        TableName: this.tableName,
        Key: {
          pk: invitationTokenPk(key.envelopeId),
          sk: invitationTokenSk(key.tokenId)
        }
      });
    } catch (error) {
      throw mapAwsError(error, "InvitationTokenRepositoryDdb.delete");
    }
  }

  /**
   * @summary Check if an invitation token exists
   */
  async exists(key: InvitationTokenKey & { envelopeId: EnvelopeId }): Promise<boolean> {
    try {
      const res = await this.ddb.get({
        TableName: this.tableName,
        Key: {
          pk: invitationTokenPk(key.envelopeId),
          sk: invitationTokenSk(key.tokenId)
        }
      });
      return !!res.Item;
    } catch (error) {
      throw mapAwsError(error, "InvitationTokenRepositoryDdb.exists");
    }
  }

  /**
   * @summary Generate a unique token ID
   */
  private generateTokenId(): string {
    return `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * @summary Generate a secure random token
   */
  private generateSecureToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}