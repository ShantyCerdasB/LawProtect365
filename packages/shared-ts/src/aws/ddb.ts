/**
 * @file dynamodb.ts
 * @description
 * Shared minimal, SDK-agnostic DynamoDB client contract used by repository adapters.
 * Compatible with low-level `@aws-sdk/client-dynamodb` as well as
 * DocumentClient-like wrappers (`@aws-sdk/lib-dynamodb`).
 *
 * Design:
 * - `update` is optional so repositories that only need get/put/delete can
 *   depend on the same interface without implementing extra methods.
 * - When an adapter requires `update` (e.g., IdempotencyStoreDdb), use
 *   the `requireUpdate` runtime/type guard before calling it.
 */

/**
 * Minimal DynamoDB client contract consumed by repositories.
 *
 * @remarks
 * - Methods follow the parameter shapes commonly used by AWS SDK v3's
 *   DocumentClient commands (Get/Put/Delete/Update).
 * - Values are intentionally typed as `Record<string, unknown>` to remain
 *   compatible with different marshalling layers.
 */
export interface DdbClientLike {
  /**
   * Reads a single item by primary key.
   *
   * @param params.TableName DynamoDB table name.
   * @param params.Key Record with the composite key (e.g., `{ pk, sk }`).
   * @param params.ConsistentRead When `true`, performs a strongly consistent read.
   * @returns A promise resolving to an object that may include the retrieved `Item`.
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
   * @param params.Key Record with the composite key (e.g., `{ pk, sk }`).
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
   * This method is optional. Adapters that require it must assert its presence
   * with `requireUpdate` before invoking it.
   *
   * @param params.TableName DynamoDB table name.
   * @param params.Key Record with the composite key (e.g., `{ pk, sk }`).
   * @param params.UpdateExpression Update expression, e.g., `SET #a = :v`.
   * @param params.ExpressionAttributeNames Optional attribute name aliases.
   * @param params.ExpressionAttributeValues Optional attribute values.
   * @param params.ConditionExpression Optional condition to guard updates.
   * @param params.ReturnValues Selector for returned attributes.
   * @returns A promise resolving to an object that may include `Attributes`.
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
}

/**
 * Narrowed type that requires the optional `update` method.
 * Useful after passing the `requireUpdate` guard.
 */
export type DdbClientWithUpdate = DdbClientLike & {
  update: NonNullable<DdbClientLike["update"]>;
};

/**
 * Runtime/type guard that asserts the presence of `update`.
 *
 * @throws {Error} If `update` is not implemented by the provided client.
 * @example
 * ```ts
 * requireUpdate(ddb);
 * await ddb.update({ ... });
 * ```
 */
export function requireUpdate(ddb: DdbClientLike): asserts ddb is DdbClientWithUpdate {
  if (typeof (ddb as DdbClientLike).update !== "function") {
    throw new Error("DdbClientLike.update is required by this operation but is undefined.");
  }
}
