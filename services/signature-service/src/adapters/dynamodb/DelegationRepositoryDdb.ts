/**
 * @file DelegationRepositoryDdb.ts
 * @summary DynamoDB-backed repository for the Delegation aggregate.
 *
 * Single-table pattern (reusing the envelopes table):
 *   - PK = "ENVELOPE#<envelopeId>"
 *   - SK = "DELEGATION#<delegationId>"
 *
 * This repository exposes a low-level `create` operation. It persists DTOs with
 * plain string timestamps and maps them back to standardized repo rows using
 * branded ISO helpers (`asISO`, `asISOOpt`) so callers get strong typing.
 */

import {
  mapAwsError,
  ConflictError,
  nowIso,
  asISO,
  asISOOpt,
} from "@lawprotect/shared-ts";
import type { DdbClientLike } from "@lawprotect/shared-ts";

import type {
  DelegationRepoCreateInput,
  DelegationRepoRow,
} from "@/adapters/shared/RepoTypes";

/** Local alias mirroring domain values; used only for the stored DTO. */
type RepoStatus = "pending" | "accepted" | "declined" | "expired";

/** Key builders */
const pk = (envelopeId: string) => `ENVELOPE#${envelopeId}`;
const sk = (delegationId: string) => `DELEGATION#${delegationId}`;

/** Shape stored in DynamoDB (plain strings for timestamps). */
interface DelegationItemDTO {
  pk: string;
  sk: string;
  type: "Delegation";
  tenantId: string;
  consentId: string;
  envelopeId: string;
  originalPartyId: string;
  delegatePartyId: string;
  reason?: string;
  status: RepoStatus;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Low-level DynamoDB repository.
 * Maps between DTOs (persistence layer) and standardized repo rows.
 */
export class DelegationRepositoryDdb {
  constructor(
    private readonly tableName: string,
    private readonly ddb: DdbClientLike
  ) {}

  /**
   * Creates a delegation item. Fails if (PK, SK) already exists.
   *
   * @param input - {@link DelegationRepoCreateInput} payload. The caller provides
   *                envelope/consent/party identifiers and optional metadata.
   *                `status` is the domain status (same literal values as stored).
   * @returns A {@link DelegationRepoRow} with branded ISO timestamps.
   * @throws ConflictError when a delegation with the same composite key exists.
   * @throws Error mapped by {@link mapAwsError} for AWS client failures.
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

      // Map back to standardized repo row (brand ISO strings where required)
      return {
        delegationId: input.delegationId,
        tenantId: input.tenantId,
        consentId: input.consentId,
        envelopeId: input.envelopeId,
        originalPartyId: input.originalPartyId,
        delegatePartyId: input.delegatePartyId,
        reason: input.reason,
        status: input.status,                // already the domain union
        createdAt: asISO(dto.createdAt),     // brand to ISODateString
        updatedAt: asISO(dto.updatedAt),     // brand to ISODateString
        expiresAt: asISOOpt(input.expiresAt),
        metadata: input.metadata,
      };
    } catch (err: any) {
      if (String(err?.name) === "ConditionalCheckFailedException") {
        throw new ConflictError("Delegation already exists");
      }
      throw mapAwsError(err, "DelegationRepositoryDdb.create");
    }
  }
}
