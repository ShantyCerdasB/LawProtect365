/**
 * @file OutboxRepositoryDdbProps.schema.ts
 * @summary Zod schema for OutboxRepositoryDdbProps validation
 * @description Validates properties for constructing OutboxRepositoryDdb
 */

import { z } from "zod";

/**
 * Zod schema for OutboxRepositoryDdbProps.
 */
export const OutboxRepositoryDdbPropsSchema = z.object({
  /** DynamoDB table name for outbox records. */
  tableName: z.string().min(1, "Table name is required"),
  
  /** DynamoDB client instance. */
  client: z.any(), // DdbClientLike from shared-ts
  
  /** Optional index configuration. */
  indexes: z.object({
    /** GSI for querying by status. */
    byStatus: z.string().min(1, "Index name must not be empty").optional(),
  }).optional(),
});

/**
 * Type inference from the schema.
 */
export type OutboxRepositoryDdbPropsSchemaType = z.infer<typeof OutboxRepositoryDdbPropsSchema>;
