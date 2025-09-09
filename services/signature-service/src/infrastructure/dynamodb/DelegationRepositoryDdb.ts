/**
 * @file DelegationRepositoryDdb.ts
 * @summary DynamoDB-backed repository for the Delegation aggregate
 * @description DynamoDB-backed repository for the Delegation aggregate.
 * Single-table pattern (reusing the envelopes table):
 *   - PK = "ENVELOPE#<envelopeId>"
 *   - SK = "DELEGATION#<delegationId>"
 * This repository exposes a low-level `create` operation. It persists DTOs with
 * plain string timestamps and maps them back to standardized repo rows using
 * branded ISO helpers (`asISO`, `asISOOpt`) so callers get strong typing.
 */

import {
  mapAwsError,
  ConflictError,
  nowIso,
} from "@lawprotect/shared-ts";
import type { DdbClientLike } from "@lawprotect/shared-ts";

import type {
  DelegationRepoCreateInput,
  DelegationRepoRow,
} from "../../domain/types/delegation";
import { DELEGATION_STATUSES } from "../../domain/values/enums";

/** Local alias mirroring domain values; used only for the stored DTO. */
type RepoStatus = (typeof DELEGATION_STATUSES)[number];

/** Key builders */
const pk = (envelopeId: string) => `ENVELOPE#${envelopeId}`;
const sk = (delegationId: string) => `DELEGATION#${delegationId}`;

import { dtoToDelegationRow, type DelegationItemDTO } from "./mappers/DelegationItemDTO.mapper";

/**
 * @description Low-level DynamoDB repository.
 * Maps between DTOs (persistence layer) and standardized repo rows.
 */
export class DelegationRepositoryDdb {
  /**
   * @description Creates a new DelegationRepositoryDdb instance.
   * @param {string} tableName - DynamoDB table name
   * @param {DdbClientLike} ddb - DynamoDB client instance
   */
  constructor(
    private readonly tableName: string,
    private readonly ddb: DdbClientLike
  ) {}

  /**
   * @description Creates a delegation item. Fails if (PK, SK) already exists.
   * @param {DelegationRepoCreateInput} input - Delegation creation parameters
   * @returns {Promise<DelegationRepoRow>} Promise resolving to the created delegation record
   * @throws {ConflictError} When a delegation with the same composite key exists
   * @throws {Error} Mapped by mapAwsError for AWS client failures
   */
  async create(input: DelegationRepoCreateInput): Promise<DelegationRepoRow> {
    const now = nowIso();

    const dto: DelegationItemDTO = {
      pk: pk(input.envelopeId),
      sk: sk(input.delegationId),
      type: "Delegation",
      tenantId: input.tenantId,
      consentId: input.consentId,
      envelopeId: input.envelopeId,
      originalPartyId: input.originalPartyId,
      delegatePartyId: input.delegatePartyId,
      reason: input.reason,
      status: input.status as RepoStatus, // same literal values as domain
      createdAt: now,
      updatedAt: now,
      expiresAt: input.expiresAt,
      metadata: input.metadata,
    };

    try {
      await this.ddb.put({
        TableName: this.tableName,
        Item: dto as unknown as Record<string, unknown>,
        ConditionExpression: "attribute_not_exists(pk) AND attribute_not_exists(sk)",
      });

      // Map back to standardized repo row using mapper
      return dtoToDelegationRow(dto);
    } catch (err: any) {
      if (String(err?.name) === "ConditionalCheckFailedException") {
        throw new ConflictError("Delegation already exists");
      }
      throw mapAwsError(err, "DelegationRepositoryDdb.create");
    }
  }
}



