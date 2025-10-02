/**
 * @file ddb.ts
 * @summary Minimal, SDK-agnostic DynamoDB client contract and guards.
 *
 * @description
 * Lightweight interfaces consumed by repository adapters. Shapes are compatible
 * with both the low-level `@aws-sdk/client-dynamodb` and the higher-level
 * `@aws-sdk/lib-dynamodb` DocumentClient. Optional methods (`update`, `query`)
 * are asserted at runtime via `requireUpdate` / `requireQuery`, which also
 * narrow the type to include those methods.
 */

/* ────────────────────────────────────────────────────────────────────────── */
/* Client contracts                                                          */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Minimal DynamoDB client contract.
 *
 * @remarks
 * - Parameter/return shapes intentionally use `Record<string, unknown>` to
 *   remain marshalling-agnostic.
 * - Methods mirror common AWS SDK v3 command inputs/outputs.
 */
export interface DdbClientLike {
  /**
   * Reads a single item by primary key.
   *
   * @param params.TableName DynamoDB table name.
   * @param params.Key Composite key (e.g., `{ pk, sk }`).
   * @param params.ConsistentRead When `true`, performs a strongly consistent read.
   * @returns Promise resolving to an object that may include the retrieved `Item`.
   */
  get(params: {
    TableName: string;
    Key: Record<string, unknown>;
    ConsistentRead?: boolean;
  }): Promise<{ Item?: Record<string, unknown> }>;

  /**
   * Creates or replaces a single item.
   *
   * @param params.TableName DynamoDB table name.
   * @param params.Item Marshalled item to persist.
   * @param params.ConditionExpression Optional condition to guard writes.
   */
  put(params: {
    TableName: string;
    Item: Record<string, unknown>;
    ConditionExpression?: string;
  }): Promise<unknown>;

  /**
   * Deletes a single item by primary key.
   *
   * @param params.TableName DynamoDB table name.
   * @param params.Key Composite key (e.g., `{ pk, sk }`).
   * @param params.ConditionExpression Optional condition to guard deletes.
   */
  delete(params: {
    TableName: string;
    Key: Record<string, unknown>;
    ConditionExpression?: string;
  }): Promise<unknown>;

  /**
   * Updates attributes of a single item.
   *
   * @remarks
   * Optional. Adapters that require it must assert with {@link requireUpdate}.
   *
   * @param params.TableName DynamoDB table name.
   * @param params.Key Composite key (e.g., `{ pk, sk }`).
   * @param params.UpdateExpression Update expression (e.g., `SET #a = :v`).
   * @param params.ExpressionAttributeNames Optional attribute name aliases.
   * @param params.ExpressionAttributeValues Optional attribute values.
   * @param params.ConditionExpression Optional condition to guard updates.
   * @param params.ReturnValues Selector for returned attributes.
   * @returns Promise resolving to an object that may include `Attributes`.
   */
  update?(params: {
    TableName: string;
    Key: Record<string, unknown>;
    UpdateExpression: string;
    ExpressionAttributeNames?: Record<string, string>;
    ExpressionAttributeValues?: Record<string, unknown>;
    ConditionExpression?: string;
    ReturnValues?: "ALL_NEW" | "ALL_OLD" | "UPDATED_NEW" | "UPDATED_OLD" | "NONE";
  }): Promise<{ Attributes?: Record<string, unknown> }>;

  /**
   * Queries items using a key condition (optionally against a GSI).
   *
   * @remarks
   * Optional. Adapters that require it must assert with {@link requireQuery}.
   *
   * @param params.TableName DynamoDB table name.
   * @param params.IndexName Optional index name (e.g., `gsi1`).
   * @param params.KeyConditionExpression Key condition expression.
   * @param params.ExpressionAttributeNames Optional attribute name aliases.
   * @param params.ExpressionAttributeValues Optional attribute values.
   * @param params.Limit Optional maximum number of items to evaluate.
   * @param params.ScanIndexForward Ascending (`true`) or descending (`false`) order.
   * @param params.ExclusiveStartKey Optional continuation key for pagination.
   * @returns Promise resolving to an object that may include `Items` and `LastEvaluatedKey`.
   */
  query?(params: {
    TableName: string;
    IndexName?: string;
    KeyConditionExpression: string;
    ExpressionAttributeNames?: Record<string, string>;
    ExpressionAttributeValues?: Record<string, unknown>;
    Limit?: number;
    ScanIndexForward?: boolean;
    ExclusiveStartKey?: Record<string, unknown>;
    FilterExpression?: string;
  }): Promise<{
    Items?: Record<string, unknown>[];
    LastEvaluatedKey?: Record<string, unknown>;
  }>;
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Narrowed types                                                            */
/* ────────────────────────────────────────────────────────────────────────── */

/** Narrowed type that requires the optional `update` method. */
export type DdbClientWithUpdate = DdbClientLike & {
  update: NonNullable<DdbClientLike["update"]>;
};

/** Narrowed type that requires the optional `query` method. */
export type DdbClientWithQuery = DdbClientLike & {
  query: NonNullable<DdbClientLike["query"]>;
};

/* ────────────────────────────────────────────────────────────────────────── */
/* Runtime/type guards                                                       */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Asserts the presence of `update` and narrows the type.
 *
 * @throws {Error} If `update` is not implemented by the provided client.
 *
 * @example
 * ```ts
 * requireUpdate(ddb);
 * await ddb.update({ ... });
 * ```
 */
export function requireUpdate(ddb: DdbClientLike): asserts ddb is DdbClientWithUpdate {
  if (typeof ddb.update !== "function") {
    throw new TypeError("DdbClientLike.update is required by this operation but is undefined.");
  }
}

/**
 * Asserts the presence of `query` and narrows the type.
 *
 * @throws {Error} If `query` is not implemented by the provided client.
 *
 * @example
 * ```ts
 * requireQuery(ddb);
 * const res = await ddb.query({ ... });
 * ```
 */
export function requireQuery(ddb: DdbClientLike): asserts ddb is DdbClientWithQuery {
  if (typeof ddb.query !== "function") {
    throw new TypeError("DdbClientLike.query is required by this operation but is undefined.");
  }
}
