/**
 * @file GlobalPartiesRepositoryDdb.ts
 * @summary DynamoDB-backed repository for the GlobalParty aggregate
 * @description DynamoDB-backed repository for the GlobalParty aggregate.
 * Single-table pattern (reusing the envelopes table):
 *   - PK = "TENANT#<tenantId>"
 *   - SK = "PARTY#<partyId>"
 * Exposes low-level CRUD and a paginated list used by app-layer adapters.
 * Validates runtime shapes (Zod) and delegates mapping to mappers/.
 */

import {
  mapAwsError,
  nowIso,
  encodeCursor,   // opaque cursors (JsonValue)
  decodeCursor,   // opaque cursors (JsonValue)
  NotFoundError,
  BadRequestError,
  ConflictError,
  requireUpdate,
  requireQuery,
  ulid,
} from "@lawprotect/shared-ts";
import type { DdbClientLike } from "@lawprotect/shared-ts";

import { dtoToGlobalPartyRow, globalPartyRowToDto } from "./mappers/GlobalPartyItemDTO.mapper";
import { GLOBAL_PARTY_STATUSES, PARTY_ROLES, PARTY_SOURCES, AUTH_METHODS } from "../../domain/values/enums";
import { GlobalPartyItemDTOSchema } from "../../presentation/schemas/global-parties/GlobalPartyItemDTO.schema";

import type {
  GlobalPartyRow,
  GlobalPartyCommon,
} from "../../shared/types/global-parties/GlobalPartiesTypes";
import type { GlobalPartiesRepository } from "../../shared/contracts/repositories/global-parties/GlobalPartiesRepository";
import type {
  CreateGlobalPartyAppInput,
  UpdateGlobalPartyAppInput,
  FindGlobalPartyByEmailAppInput,
  FindGlobalPartyByEmailAppResult,
  ListGlobalPartiesAppInput,
  ListGlobalPartiesAppResult,
  SearchGlobalPartiesByEmailAppInput,
  SearchGlobalPartiesByEmailAppResult,
} from "../../shared/types/global-parties/AppServiceInputs";

const pk = (tenantId: string) => `TENANT#${tenantId}`;
const sk = (partyId: string) => `PARTY#${partyId}`;

/**
 * @description DynamoDB-backed repository for the GlobalParty aggregate.
 * Provides CRUD operations and paginated listing for global party records.
 */
export class GlobalPartiesRepositoryDdb implements GlobalPartiesRepository {
  /**
   * @description Creates a new GlobalPartiesRepositoryDdb instance.
   * @param {string} tableName - DynamoDB table name
   * @param {DdbClientLike} ddb - DynamoDB client instance
   */
  constructor(private readonly tableName: string, private readonly ddb: DdbClientLike) {}

  /**
   * @summary Creates a new global party record in DynamoDB
   * @description Creates a new global party record with validation of enum values and conflict checking.
   * 
   * @param {CreateGlobalPartyAppInput} input - Global party creation parameters
   * @returns {Promise<void>} Promise resolving when creation is complete
   * @throws {BadRequestError} When party role, source, or status is invalid
   * @throws {ConflictError} When global party already exists
   */
  async create(input: CreateGlobalPartyAppInput): Promise<void> {
    // Validate enum values
    if (!PARTY_ROLES.includes(input.role as any)) {
      throw new BadRequestError(`Invalid party role: ${input.role}`, "INPUT_TYPE_NOT_ALLOWED", {
        validRoles: PARTY_ROLES,
        providedRole: input.role,
      });
    }
    
    if (!PARTY_SOURCES.includes(input.source as any)) {
      throw new BadRequestError(`Invalid party source: ${input.source}`, "INPUT_TYPE_NOT_ALLOWED", {
        validSources: PARTY_SOURCES,
        providedSource: input.source,
      });
    }

    if (!GLOBAL_PARTY_STATUSES.includes(input.status as any)) {
      throw new BadRequestError(`Invalid party status: ${input.status}`, "INPUT_TYPE_NOT_ALLOWED", {
        validStatuses: GLOBAL_PARTY_STATUSES,
        providedStatus: input.status,
      });
    }

    if (!AUTH_METHODS.includes(input.preferences.defaultAuth as any)) {
      throw new BadRequestError(`Invalid auth method: ${input.preferences.defaultAuth}`, "INPUT_TYPE_NOT_ALLOWED", {
        validAuthMethods: AUTH_METHODS,
        providedAuthMethod: input.preferences.defaultAuth,
      });
    }

    const now = nowIso();
    const party: GlobalPartyRow = {
      partyId: input.partyId as any,
      tenantId: input.tenantId as any,
      name: input.name,
      email: input.email,
      emails: input.emails,
      phone: input.phone,
      locale: input.locale,
      role: input.role,
      source: input.source,
      status: input.status,
      tags: input.tags,
      metadata: input.metadata,
      attributes: input.attributes,
      preferences: input.preferences,
      notificationPreferences: input.notificationPreferences,
      stats: input.stats,
      createdAt: now,
      updatedAt: now,
    };

    const dto = globalPartyRowToDto(
      party,
      pk(input.tenantId as string),
      sk(input.partyId as string)
    );

    // Validate DTO with Zod schema
    const validatedDto = GlobalPartyItemDTOSchema.parse(dto);

    try {
      await this.ddb.put({
        TableName: this.tableName,
        Item: validatedDto as any,
        ConditionExpression: "attribute_not_exists(pk) AND attribute_not_exists(sk)",
      });
    } catch (error) {
      if (error && typeof error === 'object' && 'name' in error && error.name === "ConditionalCheckFailedException") {
        throw new ConflictError(`Global party already exists: ${input.partyId}`, "GLOBAL_PARTY_ALREADY_EXISTS", {
          partyId: input.partyId,
          tenantId: input.tenantId,
        });
      }
      throw mapAwsError(error, "Failed to create global party");
    }
  }

  /**
   * @summary Retrieves a global party by ID
   * @description Retrieves a global party record by tenant ID and party ID.
   * 
   * @param {string} tenantId - Tenant identifier
   * @param {string} partyId - Party identifier
   * @returns {Promise<GlobalPartyRow | null>} Promise resolving to the global party record or null if not found
   */
  async getById(tenantId: string, partyId: string): Promise<GlobalPartyRow | null> {
    try {
      const result = await this.ddb.get({
        TableName: this.tableName,
        Key: {
          pk: pk(tenantId),
          sk: sk(partyId),
        },
      });

      if (!result.Item) {
        return null;
      }

      const validatedDto = GlobalPartyItemDTOSchema.parse(result.Item);
      return dtoToGlobalPartyRow(validatedDto);
    } catch (error) {
      throw mapAwsError(error, "Failed to get global party by ID");
    }
  }

  /**
   * @summary Updates an existing global party record
   * @description Updates a global party record with partial data, validating enum values.
   * 
   * @param {UpdateGlobalPartyAppInput} input - Update input with tenantId, partyId, and updates
   * @returns {Promise<void>} Promise resolving when update is complete
   * @throws {NotFoundError} When global party is not found
   * @throws {BadRequestError} When update data is invalid
   */
  async update(input: UpdateGlobalPartyAppInput): Promise<void> {
    // Validate enum values if provided
    if (input.updates.role && !PARTY_ROLES.includes(input.updates.role as any)) {
      throw new BadRequestError(`Invalid party role: ${input.updates.role}`, "INPUT_TYPE_NOT_ALLOWED", {
        validRoles: PARTY_ROLES,
        providedRole: input.updates.role,
      });
    }

    if (input.updates.source && !PARTY_SOURCES.includes(input.updates.source as any)) {
      throw new BadRequestError(`Invalid party source: ${input.updates.source}`, "INPUT_TYPE_NOT_ALLOWED", {
        validSources: PARTY_SOURCES,
        providedSource: input.updates.source,
      });
    }

    if (input.updates.status && !GLOBAL_PARTY_STATUSES.includes(input.updates.status as any)) {
      throw new BadRequestError(`Invalid party status: ${input.updates.status}`, "INPUT_TYPE_NOT_ALLOWED", {
        validStatuses: GLOBAL_PARTY_STATUSES,
        providedStatus: input.updates.status,
      });
    }

    if (input.updates.preferences?.defaultAuth && !AUTH_METHODS.includes(input.updates.preferences.defaultAuth as any)) {
      throw new BadRequestError(`Invalid auth method: ${input.updates.preferences.defaultAuth}`, "INPUT_TYPE_NOT_ALLOWED", {
        validAuthMethods: AUTH_METHODS,
        providedAuthMethod: input.updates.preferences.defaultAuth,
      });
    }

    const now = nowIso();
    const updateExpression: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    // Build update expression dynamically
    Object.entries(input.updates).forEach(([key, value]) => {
      if (value !== undefined) {
        const attrName = `#${key}`;
        const attrValue = `:${key}`;
        updateExpression.push(`${attrName} = ${attrValue}`);
        expressionAttributeNames[attrName] = key;
        expressionAttributeValues[attrValue] = value;
      }
    });

    // Always update updatedAt
    updateExpression.push("#updatedAt = :updatedAt");
    expressionAttributeNames["#updatedAt"] = "updatedAt";
    expressionAttributeValues[":updatedAt"] = now;

    try {
      requireUpdate(this.ddb);
      const result = await this.ddb.update({
        TableName: this.tableName,
        Key: {
          pk: pk(input.tenantId as string),
          sk: sk(input.partyId as string),
        },
        UpdateExpression: `SET ${updateExpression.join(", ")}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: "ALL_NEW",
      });

      if (!result.Attributes) {
        throw new NotFoundError(`Global party not found: ${input.partyId}`, "GLOBAL_PARTY_NOT_FOUND", {
          partyId: input.partyId,
          tenantId: input.tenantId,
        });
      }
    } catch (error) {
      if (error && typeof error === 'object' && 'name' in error && error.name === "NotFoundError") {
        throw error;
      }
      throw mapAwsError(error, "Failed to update global party");
    }
  }

  /**
   * @summary Deletes a global party record
   * @description Deletes a global party record by tenant ID and party ID.
   * 
   * @param {string} tenantId - Tenant identifier
   * @param {string} partyId - Party identifier
   * @returns {Promise<GlobalPartyRow>} Promise resolving to the deleted global party record
   * @throws {NotFoundError} When global party is not found
   */
  async delete(tenantId: string, partyId: string): Promise<GlobalPartyRow> {
    try {
      // First get the item to return it - we need to implement a proper getById with tenantId
      // For now, we'll do a direct query to get the item
      const result = await this.ddb.get({
        TableName: this.tableName,
        Key: {
          pk: pk(tenantId),
          sk: sk(partyId),
        },
      });

      if (!result.Item) {
        throw new NotFoundError(`Global party not found: ${partyId}`, "GLOBAL_PARTY_NOT_FOUND", {
          partyId,
          tenantId,
        });
      }

      const validatedDto = GlobalPartyItemDTOSchema.parse(result.Item);
      const existingItem = dtoToGlobalPartyRow(validatedDto);

      await this.ddb.delete({
        TableName: this.tableName,
        Key: {
          pk: pk(tenantId),
          sk: sk(partyId),
        },
      });

      return existingItem;
    } catch (error) {
      if (error && typeof error === 'object' && 'name' in error && error.name === "NotFoundError") {
        throw error;
      }
      throw mapAwsError(error, "Failed to delete global party");
    }
  }

  /**
   * @summary Lists global parties with pagination
   * @description Lists global parties for a tenant with optional filtering and pagination.
   * 
   * @param {ListGlobalPartiesAppInput} input - List input with tenantId and filters
   * @returns {Promise<ListGlobalPartiesAppResult>} Promise resolving to paginated results
   */
  async list(input: ListGlobalPartiesAppInput): Promise<ListGlobalPartiesAppResult> {
    const { search, tags, role, source, status, limit = 50, cursor } = input;

    let filterExpression = "pk = :pk";
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {
      ":pk": pk(input.tenantId as string),
    };

    // Add filters
    if (search) {
      filterExpression += " AND (contains(#name, :search) OR contains(#email, :search))";
      expressionAttributeNames["#name"] = "name";
      expressionAttributeNames["#email"] = "email";
      expressionAttributeValues[":search"] = search;
    }

    if (tags && tags.length > 0) {
      filterExpression += " AND contains(#tags, :tags)";
      expressionAttributeNames["#tags"] = "tags";
      expressionAttributeValues[":tags"] = tags;
    }

    if (role) {
      filterExpression += " AND #role = :role";
      expressionAttributeNames["#role"] = "role";
      expressionAttributeValues[":role"] = role;
    }

    if (source) {
      filterExpression += " AND #source = :source";
      expressionAttributeNames["#source"] = "source";
      expressionAttributeValues[":source"] = source;
    }

    if (status) {
      filterExpression += " AND #status = :status";
      expressionAttributeNames["#status"] = "status";
      expressionAttributeValues[":status"] = status;
    }

    const queryParams: any = {
      TableName: this.tableName,
      KeyConditionExpression: "pk = :pk",
      FilterExpression: filterExpression,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      Limit: limit,
    };

    if (cursor) {
      queryParams.ExclusiveStartKey = decodeCursor(cursor);
    }

    try {
      requireQuery(this.ddb);
      const result = await this.ddb.query(queryParams);
      const parties: GlobalPartyCommon[] = [];

      if (result.Items) {
        for (const item of result.Items) {
          try {
            const validatedDto = GlobalPartyItemDTOSchema.parse(item);
            const row = dtoToGlobalPartyRow(validatedDto);
            parties.push(row);
          } catch (error) {
            // Skip invalid items
            console.warn(`Skipping invalid global party item:`, error);
          }
        }
      }

      let nextCursor: string | undefined;
      if (result.LastEvaluatedKey) {
        nextCursor = encodeCursor(result.LastEvaluatedKey as any);
      }

      return {
        parties,
        nextCursor,
        total: parties.length, // Note: This is approximate due to filtering
      };
    } catch (error) {
      throw mapAwsError(error, "Failed to list global parties");
    }
  }

  /**
   * @summary Searches global parties by email
   * @description Searches for global parties by email address within a tenant.
   * 
   * @param {SearchGlobalPartiesByEmailAppInput} input - Search input with tenantId, email, and limit
   * @returns {Promise<SearchGlobalPartiesByEmailAppResult>} Promise resolving to search results
   */
  async searchByEmail(input: SearchGlobalPartiesByEmailAppInput): Promise<SearchGlobalPartiesByEmailAppResult> {
    try {
      requireQuery(this.ddb);
      const result = await this.ddb.query({
        TableName: this.tableName,
        KeyConditionExpression: "pk = :pk",
        FilterExpression: "contains(#email, :email) OR contains(#emails, :email)",
        ExpressionAttributeNames: {
          "#email": "email",
          "#emails": "emails",
        },
        ExpressionAttributeValues: {
          ":pk": pk(input.tenantId as string),
          ":email": input.email,
        },
        Limit: input.limit || 10,
      });

      const parties: GlobalPartyCommon[] = [];

      if (result.Items) {
        for (const item of result.Items) {
          try {
            const validatedDto = GlobalPartyItemDTOSchema.parse(item);
            const row = dtoToGlobalPartyRow(validatedDto);
            parties.push(row);
          } catch (error) {
            // Skip invalid items
            console.warn(`Skipping invalid global party item:`, error);
          }
        }
      }

      return { parties };
    } catch (error) {
      throw mapAwsError(error, "Failed to search global parties by email");
    }
  }

  /**
   * @summary Finds a global party by email
   * @description Finds a single global party by email address within a tenant.
   * 
   * @param {FindGlobalPartyByEmailAppInput} input - Find input with tenantId and email
   * @returns {Promise<FindGlobalPartyByEmailAppResult | null>} Promise resolving to found party or null
   */
  async findByEmail(input: FindGlobalPartyByEmailAppInput): Promise<FindGlobalPartyByEmailAppResult | null> {
    try {
      requireQuery(this.ddb);
      const result = await this.ddb.query({
        TableName: this.tableName,
        KeyConditionExpression: "pk = :pk",
        FilterExpression: "contains(#email, :email) OR contains(#emails, :email)",
        ExpressionAttributeNames: {
          "#email": "email",
          "#emails": "emails",
        },
        ExpressionAttributeValues: {
          ":pk": pk(input.tenantId as string),
          ":email": input.email,
        },
        Limit: 1,
      });

      if (!result.Items?.length) {
        return null;
      }

      try {
        const validatedDto = GlobalPartyItemDTOSchema.parse(result.Items[0]);
        const row = dtoToGlobalPartyRow(validatedDto);
        return { party: row };
      } catch (error) {
        // Skip invalid items
        console.warn(`Skipping invalid global party item:`, error);
        return null;
      }
    } catch (error) {
      throw mapAwsError(error, "Failed to find global parties by email");
    }
  }

  /**
   * @summary Finds an existing party by email or creates a new one for delegation
   * @description This method is used for delegation scenarios where we need to find or create a party.
   * 
   * @param {Object} input - Input parameters
   * @param {string} input.tenantId - Tenant identifier
   * @param {string} input.email - Email address
   * @param {string} input.name - Party name
   * @returns {Promise<string>} Promise resolving to the party ID
   */
  async findOrCreatePartyForDelegate(input: { 
    tenantId: string; 
    email: string; 
    name: string 
  }): Promise<string> {
    // First try to find existing party
    const findResult = await this.findByEmail({
      tenantId: input.tenantId as any,
      email: input.email,
    });
    
    if (findResult && findResult.party) {
      return findResult.party.partyId as string;
    }

    // Create new party if not found
    const partyId = `party_${ulid()}`;
    const partyInput: CreateGlobalPartyAppInput = {
      partyId: partyId as any,
      tenantId: input.tenantId as any,
      name: input.name,
      email: input.email,
      role: "signer" as any,
      source: "manual" as any,
      status: "active" as any,
      preferences: {
        defaultAuth: "otpViaEmail" as any,
        defaultLocale: undefined,
      },
      notificationPreferences: {
        email: true,
        sms: false,
      },
      stats: {
        signedCount: 0,
        totalEnvelopes: 0,
      },
    };

    await this.create(partyInput);
    return partyId;
  }
}
