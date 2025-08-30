/**
 * @file DelegationRecord.ts
 * @summary Delegation record value object for party delegation tracking
 * @description Provides structured tracking of party delegations including
 * original party, delegate, reason, and audit information.
 */

import { z } from "zod";
import type { Brand } from "@lawprotect/shared-ts";
import type { PartyId, TenantId } from "../Ids";

/**
 * Branded type for delegation records
 * Prevents mixing with other object types at compile time
 */
export type DelegationRecord = Brand<{
  readonly id: string;
  readonly tenantId: TenantId;
  readonly originalPartyId: PartyId;
  readonly delegatePartyId: PartyId;
  readonly reason: string;
  readonly type: "temporary" | "permanent";
  readonly expiresAt?: string;
  readonly createdAt: string;
  readonly createdBy: string;
  readonly metadata?: Record<string, unknown>;
}, "DelegationRecord">;

/**
 * Zod schema for delegation record validation
 */
export const DelegationRecordSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  originalPartyId: z.string().min(1),
  delegatePartyId: z.string().min(1),
  reason: z.string().min(1, "Delegation reason is required").max(500, "Reason too long"),
  type: z.enum(["temporary", "permanent"]),
  expiresAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  createdBy: z.string().min(1),
  metadata: z.record(z.unknown()).optional(),
}).transform((v) => v as DelegationRecord);

/**
 * Creates a DelegationRecord from input data
 * @param data - The delegation data
 * @returns The validated DelegationRecord
 * @throws {ZodError} When the data is invalid
 */
export const toDelegationRecord = (data: {
  id: string;
  tenantId: TenantId;
  originalPartyId: PartyId;
  delegatePartyId: PartyId;
  reason: string;
  type: "temporary" | "permanent";
  expiresAt?: string;
  createdAt: string;
  createdBy: string;
  metadata?: Record<string, unknown>;
}): DelegationRecord => {
  return DelegationRecordSchema.parse(data);
};

/**
 * Safely creates a DelegationRecord from input data
 * @param data - The delegation data
 * @returns The validated DelegationRecord or null if invalid
 */
export const toDelegationRecordSafe = (data: {
  id: string;
  tenantId: TenantId;
  originalPartyId: PartyId;
  delegatePartyId: PartyId;
  reason: string;
  type: "temporary" | "permanent";
  expiresAt?: string;
  createdAt: string;
  createdBy: string;
  metadata?: Record<string, unknown>;
}): DelegationRecord | null => {
  const result = DelegationRecordSchema.safeParse(data);
  return result.success ? result.data : null;
};

/**
 * Type guard to check if a value is a valid DelegationRecord
 * @param value - The value to check
 * @returns True if the value is a valid DelegationRecord
 */
export const isDelegationRecord = (value: unknown): value is DelegationRecord => {
  return DelegationRecordSchema.safeParse(value).success;
};

/**
 * Checks if a delegation is expired
 * @param delegation - The delegation record to check
 * @returns True if the delegation is expired
 */
export const isDelegationExpired = (delegation: DelegationRecord): boolean => {
  if (delegation.type === "permanent") return false;
  if (!delegation.expiresAt) return false;
  
  const now = new Date();
  const expiresAt = new Date(delegation.expiresAt);
  return now > expiresAt;
};

/**
 * Checks if a delegation is active (not expired)
 * @param delegation - The delegation record to check
 * @returns True if the delegation is active
 */
export const isDelegationActive = (delegation: DelegationRecord): boolean => {
  return !isDelegationExpired(delegation);
};

/**
 * Creates a new delegation record with current timestamp
 * @param data - The delegation data (without timestamps)
 * @returns New DelegationRecord with current timestamps
 */
export const createDelegationRecord = (data: {
  id: string;
  tenantId: TenantId;
  originalPartyId: PartyId;
  delegatePartyId: PartyId;
  reason: string;
  type: "temporary" | "permanent";
  expiresAt?: string;
  createdBy: string;
  metadata?: Record<string, unknown>;
}): DelegationRecord => {
  return toDelegationRecord({
    ...data,
    createdAt: new Date().toISOString(),
  });
};
