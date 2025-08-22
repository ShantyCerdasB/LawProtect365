/**
 * @file dynamodb.test.ts
 * @summary Unit tests for the DynamoDB client contract and the `requireUpdate` guard.
 */

import {
  requireUpdate,
  type DdbClientLike,
} from "../../src/aws";

describe("requireUpdate", () => {
  it("throws when update is missing", () => {
    const client: DdbClientLike = {
      get: jest.fn(async () => ({})),
      put: jest.fn(async () => undefined),
      delete: jest.fn(async () => undefined),
      // update is intentionally absent
    };

    expect(() => requireUpdate(client)).toThrow(
      "DdbClientLike.update is required by this operation but is undefined."
    );
  });

  it("throws when update is present but not a function", () => {
    const client = {
      get: jest.fn(async () => ({})),
      put: jest.fn(async () => undefined),
      delete: jest.fn(async () => undefined),
      update: 123 as any,
    } as DdbClientLike;

    expect(() => requireUpdate(client)).toThrow(
      "DdbClientLike.update is required by this operation but is undefined."
    );
  });

  it("narrows the client and allows invoking update after the guard", async () => {
    const update = jest.fn(async () => ({ Attributes: { ok: true } }));
    const client: DdbClientLike = {
      get: jest.fn(async () => ({})),
      put: jest.fn(async () => undefined),
      delete: jest.fn(async () => undefined),
      update,
    };

    // Call the guard directly so TypeScript narrows `client` in this scope
    requireUpdate(client);

    const res = await client.update({
      TableName: "tbl",
      Key: { pk: "A", sk: "1" },
      UpdateExpression: "SET #s = :v",
      ExpressionAttributeNames: { "#s": "state" },
      ExpressionAttributeValues: { ":v": "ok" },
      ConditionExpression: "attribute_exists(pk)",
      ReturnValues: "ALL_NEW",
    });

    expect(update).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        TableName: "tbl",
        Key: { pk: "A", sk: "1" },
        UpdateExpression: "SET #s = :v",
        ReturnValues: "ALL_NEW",
      })
    );
    expect(res).toEqual({ Attributes: { ok: true } });
  });
});
