/**
 * @summary Minimal DynamoDB client contract consumed by repositories.
 * @description
 * Thin, SDK-agnostic interface that models the subset of operations required by
 * repository adapters. It is compatible with low-level DynamoDB clients as well
 * as DocumentClient-like wrappers.
 *
 * The `update` method is optional so this contract can be shared by repositories
 * that only need `get`/`put`/`delete`.
 */
export interface DdbClientLike {
  /**
   * Reads a single item by primary key.
   *
   * @param params - Parameters object.
   * @param params.TableName - DynamoDB table name.
   * @param params.Key - Primary key record containing `pk` and `sk`.
   * @param params.ConsistentRead - When `true`, performs a strongly consistent read.
   * @returns A promise resolving to an object that may include the retrieved `Item`.
   *
   * @example
   * ```ts
   * const out = await ddb.get({
   *   TableName: "app-table",
   *   Key: { pk: "ENVELOPE#123", sk: "META" },
   *   ConsistentRead: true,
   * });
   * const item = out.Item;
   * ```
   */
  get(params: {
    TableName: string;
    Key: Record<string, unknown>;
    ConsistentRead?: boolean;
  }): Promise<{ Item?: Record<string, unknown> }>;

  /**
   * Creates or replaces a single item.
   *
   * @param params - Parameters object.
   * @param params.TableName - DynamoDB table name.
   * @param params.Item - Item to persist (marshalled record).
   * @param params.ConditionExpression - Optional conditional expression to guard writes.
   * @returns A promise that resolves when the write completes.
   *
   * @example
   * ```ts
   * await ddb.put({
   *   TableName: "app-table",
   *   Item: { pk: "ENVELOPE#123", sk: "META", type: "Envelope" },
   *   ConditionExpression: "attribute_not_exists(pk) AND attribute_not_exists(sk)",
   * });
   * ```
   */
  put(params: {
    TableName: string;
    Item: Record<string, unknown>;
    ConditionExpression?: string;
  }): Promise<unknown>;

  /**
   * Deletes a single item by primary key.
   *
   * @param params - Parameters object.
   * @param params.TableName - DynamoDB table name.
   * @param params.Key - Primary key record containing `pk` and `sk`.
   * @param params.ConditionExpression - Optional conditional expression to guard deletes.
   * @returns A promise that resolves when the delete completes.
   *
   * @example
   * ```ts
   * await ddb.delete({
   *   TableName: "app-table",
   *   Key: { pk: "ENVELOPE#123", sk: "META" },
   *   ConditionExpression: "attribute_exists(pk) AND attribute_exists(sk)",
   * });
   * ```
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
   * This method is optional in the contract. Implementations may omit it if not needed
   * by a given repository.
   *
   * @param params - Parameters object.
   * @param params.TableName - DynamoDB table name.
   * @param params.Key - Primary key record containing `pk` and `sk`.
   * @param params.UpdateExpression - Update expression (e.g., `SET #a = :v`).
   * @param params.ExpressionAttributeNames - Optional attribute name aliases.
   * @param params.ExpressionAttributeValues - Optional attribute values.
   * @param params.ConditionExpression - Optional conditional expression to guard updates.
   * @param params.ReturnValues - Selector for returned attributes.
   * @returns A promise resolving to an object that may include `Attributes`
   *          depending on `ReturnValues`.
   *
   * @example
   * ```ts
   * await ddb.update({
   *   TableName: "app-table",
   *   Key: { pk: "IDEMPOTENCY#k", sk: "META" },
   *   ConditionExpression: "attribute_exists(pk) AND attribute_exists(sk)",
   *   UpdateExpression: "SET #state = :s, #updatedAt = :t",
   *   ExpressionAttributeNames: { "#state": "state", "#updatedAt": "updatedAt" },
   *   ExpressionAttributeValues: { ":s": "completed", ":t": new Date().toISOString() },
   *   ReturnValues: "NONE",
   * });
   * ```
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
