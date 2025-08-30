/**
 * @file GlobalPartyRepositoryDdb.ts
 * @summary DynamoDB repository for Global Parties (contacts)
 * @description DynamoDB implementation for Global Party persistence.
 * Handles CRUD operations for Global Parties with proper indexing and querying.
 */

import type { GlobalParty } from "@/domain/entities/GlobalParty";
import type { GlobalPartyStatus, PartyRole, PartySource } from "@/domain/values/enums";
import type { DdbClientLike } from "@lawprotect/shared-ts";

/**
 * @description Input for listing Global Parties with filters.
 */
export interface ListGlobalPartiesInput {
  tenantId: string;
  search?: string;
  tags?: string[];
  role?: PartyRole;
  source?: PartySource;
  status?: GlobalPartyStatus;
  limit?: number;
  cursor?: string;
}

/**
 * @description Input for searching Global Parties by email.
 */
export interface SearchGlobalPartiesByEmailInput {
  tenantId: string;
  email: string;
  limit?: number;
}

/**
 * @description Result of listing Global Parties.
 */
export interface ListGlobalPartiesResult {
  items: GlobalParty[];
  nextCursor?: string;
  total: number;
}

/**
 * @description Result of searching Global Parties by email.
 */
export interface SearchGlobalPartiesByEmailResult {
  items: GlobalParty[];
}

/**
 * @description DynamoDB repository for Global Parties.
 */
export class GlobalPartyRepositoryDdb {
  constructor(
    private readonly tableName: string,
    private readonly client: DdbClientLike
  ) {}

  /**
   * @description Creates a new Global Party.
   */
  async create(globalParty: GlobalParty): Promise<void> {
    await this.client.put({
      TableName: this.tableName,
      Item: {
        PK: `TENANT#${globalParty.tenantId}`,
        SK: `GLOBAL_PARTY#${globalParty.id}`,
        GSI1PK: `EMAIL#${globalParty.email.toLowerCase()}`,
        GSI1SK: `TENANT#${globalParty.tenantId}`,
        GSI2PK: `TENANT#${globalParty.tenantId}`,
        GSI2SK: `STATUS#${globalParty.status}`,
        ...globalParty,
      },
    });
  }

  /**
   * @description Updates an existing Global Party.
   */
  async update(globalParty: GlobalParty): Promise<void> {
    const existing = await this.getById(globalParty.id);
    if (!existing) {
      throw new Error(`Global Party with ID ${globalParty.id} not found`);
    }

    await this.client.update({
      TableName: this.tableName,
      Key: {
        PK: `TENANT#${globalParty.tenantId}`,
        SK: `GLOBAL_PARTY#${globalParty.id}`,
      },
      UpdateExpression: "SET #name = :name, #email = :email, #emails = :emails, #phone = :phone, #locale = :locale, #role = :role, #source = :source, #status = :status, #tags = :tags, #attributes = :attributes, #preferences = :preferences, #notificationPreferences = :notificationPreferences, #stats = :stats, #updatedAt = :updatedAt, GSI1PK = :gsi1pk, GSI1SK = :gsi1sk, GSI2PK = :gsi2pk, GSI2SK = :gsi2sk",
      ExpressionAttributeNames: {
        "#name": "name",
        "#email": "email",
        "#emails": "emails",
        "#phone": "phone",
        "#locale": "locale",
        "#role": "role",
        "#source": "source",
        "#status": "status",
        "#tags": "tags",
        "#attributes": "attributes",
        "#preferences": "preferences",
        "#notificationPreferences": "notificationPreferences",
        "#stats": "stats",
        "#updatedAt": "updatedAt",
      },
      ExpressionAttributeValues: {
        ":name": globalParty.name,
        ":email": globalParty.email,
        ":emails": globalParty.emails,
        ":phone": globalParty.phone,
        ":locale": globalParty.locale,
        ":role": globalParty.role,
        ":source": globalParty.source,
        ":status": globalParty.status,
        ":tags": globalParty.tags,
        ":attributes": globalParty.attributes,
        ":preferences": globalParty.preferences,
        ":notificationPreferences": globalParty.notificationPreferences,
        ":stats": globalParty.stats,
        ":updatedAt": globalParty.updatedAt,
        ":gsi1pk": `EMAIL#${globalParty.email.toLowerCase()}`,
        ":gsi1sk": `TENANT#${globalParty.tenantId}`,
        ":gsi2pk": `TENANT#${globalParty.tenantId}`,
        ":gsi2sk": `STATUS#${globalParty.status}`,
      },
    });
  }

  /**
   * @description Gets a Global Party by ID.
   */
  async getById(globalPartyId: string): Promise<GlobalParty | null> {
    // First, try to find by scanning (since we don't have a direct lookup)
    const result = await this.client.query({
      TableName: this.tableName,
      IndexName: "GSI1",
      KeyConditionExpression: "GSI1PK = :gsi1pk",
      ExpressionAttributeValues: {
        ":gsi1pk": `GLOBAL_PARTY#${globalPartyId}`,
      },
      Limit: 1,
    });

    if (result.Items && result.Items.length > 0) {
      const item = result.Items[0];
      return this.mapToGlobalParty(item);
    }

    return null;
  }

  /**
   * @description Lists Global Parties with optional filters.
   */
  async list(input: ListGlobalPartiesInput): Promise<ListGlobalPartiesResult> {
    const { tenantId, search, tags, role, source, status, limit = 20, cursor } = input;

    let keyConditionExpression = "GSI2PK = :gsi2pk";
    let expressionAttributeValues: Record<string, any> = {
      ":gsi2pk": `TENANT#${tenantId}`,
    };
    let filterExpressions: string[] = [];

    // Add status filter if provided
    if (status) {
      keyConditionExpression += " AND GSI2SK = :gsi2sk";
      expressionAttributeValues[":gsi2sk"] = `STATUS#${status}`;
    }

    // Add role filter
    if (role) {
      filterExpressions.push("#role = :role");
      expressionAttributeValues[":role"] = role;
    }

    // Add source filter
    if (source) {
      filterExpressions.push("#source = :source");
      expressionAttributeValues[":source"] = source;
    }

    // Add search filter (name or email contains)
    if (search) {
      filterExpressions.push("(contains(#name, :search) OR contains(#email, :search))");
      expressionAttributeValues[":search"] = search;
    }

    // Add tags filter
    if (tags && tags.length > 0) {
      filterExpressions.push("(contains(#tags, :tags))");
      expressionAttributeValues[":tags"] = tags;
    }

    const queryParams: any = {
      TableName: this.tableName,
      IndexName: "GSI2",
      KeyConditionExpression: keyConditionExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      Limit: limit,
    };

    if (filterExpressions.length > 0) {
      queryParams.FilterExpression = filterExpressions.join(" AND ");
    }

    if (cursor) {
      queryParams.ExclusiveStartKey = JSON.parse(cursor);
    }

    const result = await this.client.query(queryParams);

    const globalParties = (result.Items || []).map(item => this.mapToGlobalParty(item));

    return {
      items: globalParties,
      nextCursor: result.LastEvaluatedKey ? JSON.stringify(result.LastEvaluatedKey) : undefined,
      total: globalParties.length, // Note: This is not the total count, just the current page
    };
  }

  /**
   * @description Searches Global Parties by email.
   */
  async searchByEmail(input: SearchGlobalPartiesByEmailInput): Promise<SearchGlobalPartiesByEmailResult> {
    const { tenantId, email, limit = 10 } = input;

    const result = await this.client.query({
      TableName: this.tableName,
      IndexName: "GSI1",
      KeyConditionExpression: "GSI1PK = :gsi1pk AND GSI1SK = :gsi1sk",
      ExpressionAttributeValues: {
        ":gsi1pk": `EMAIL#${email.toLowerCase()}`,
        ":gsi1sk": `TENANT#${tenantId}`,
      },
      Limit: limit,
    });

    const globalParties = (result.Items || []).map(item => this.mapToGlobalParty(item));

    return {
      items: globalParties,
    };
  }

  /**
   * @description Maps DynamoDB item to GlobalParty entity.
   */
  private mapToGlobalParty(item: Record<string, any>): GlobalParty {
    return {
      id: item.id,
      tenantId: item.tenantId,
      name: item.name,
      email: item.email,
      emails: item.emails,
      phone: item.phone,
      locale: item.locale,
      role: item.role,
      source: item.source,
      status: item.status,
      tags: item.tags,
      attributes: item.attributes,
      preferences: item.preferences,
      notificationPreferences: item.notificationPreferences,
      stats: item.stats,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
}
