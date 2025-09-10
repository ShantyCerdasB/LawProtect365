/**
 * @file RateLimitStoreDdb.ts
 * @summary DynamoDB-backed implementation of RateLimitStore for OTP rate limiting.
 * @description
 * Single-table layout:
 * - PK = "RATE_LIMIT#<key>"
 * - SK = "WINDOW#<windowStart>"
 * 
 * Attributes:
 * - type: "RateLimit"
 * - rateLimitKey: string
 * - windowStart: number (epoch seconds)
 * - windowEnd: number (epoch seconds)
 * - currentUsage: number
 * - maxRequests: number
 * - createdAt: ISO-8601 string
 * - updatedAt: ISO-8601 string
 * - ttl: epoch seconds (number)
 */

import { mapAwsError, nowIso, TooManyRequestsError, ErrorCodes } from "../../index.js";
import type { DdbClientLike } from "../ddb.js";
import type { RateLimitStore, RateLimitWindow, RateLimitUsage } from "../../contracts/ratelimit/index.js";
import type { DdbRateLimitItem } from "./types.js";
import { RATE_LIMIT_ENTITY } from "./types.js";

/** Key builders. */
const rateLimitPk = (key: string): string => `RATE_LIMIT#${key}`;
const rateLimitSk = (windowStart: number): string => `WINDOW#${windowStart}`;

/**
 * Converts a typed object into a `Record<string, unknown>` suitable for DynamoDB clients.
 */
const toDdbItem = <T extends object>(v: T): Record<string, unknown> =>
  (v as unknown) as Record<string, unknown>;

/**
 * Converts TTL seconds to epoch seconds.
 */
const toTtl = (ttlSeconds: number): number => {
  return Math.floor(Date.now() / 1000) + ttlSeconds;
};

/**
 * Calculates the current window start time based on window size.
 */
const calculateWindowStart = (windowSeconds: number, now = Date.now()): number => {
  const windowMs = windowSeconds * 1000;
  return Math.floor(now / windowMs) * windowMs / 1000;
};

/**
 * DynamoDB implementation of RateLimitStore.
 */
export class RateLimitStoreDdb implements RateLimitStore {
  constructor(
    private readonly tableName: string,
    private readonly ddb: DdbClientLike
  ) {}

  /**
   * Increments the rate limit counter and checks if limit is exceeded.
   */
  async incrementAndCheck(key: string, window: RateLimitWindow): Promise<RateLimitUsage> {
    const now = Date.now();
    const windowStart = calculateWindowStart(window.windowSeconds, now);

    // Try to increment existing record
    try {
      const result = await this.ddb.update!({
        TableName: this.tableName,
        Key: {
          pk: rateLimitPk(key),
          sk: rateLimitSk(windowStart)},
        UpdateExpression: "SET currentUsage = currentUsage + :inc, updatedAt = :updatedAt",
        ConditionExpression: "currentUsage < :maxRequests",
        ExpressionAttributeValues: {
          ":inc": 1,
          ":maxRequests": window.maxRequests,
          ":updatedAt": nowIso()},
        ReturnValues: "ALL_NEW"});

      const item = result.Attributes as unknown as DdbRateLimitItem;
      return {
        currentUsage: item.currentUsage,
        maxRequests: item.maxRequests,
        windowStart: item.windowStart,
        windowEnd: item.windowEnd,
        resetInSeconds: item.windowEnd - Math.floor(now / 1000)};
    } catch (err: any) {
      if (String(err?.name) === "ConditionalCheckFailedException") {
        // Try to create a new record - if it fails, rate limit is exceeded
        try {
          return await this.createRecord(key, window);
        } catch (createErr: any) {
          if (String(createErr?.name) === "ConditionalCheckFailedException") {
            // Record exists and rate limit exceeded
            throw new TooManyRequestsError(
              "Rate limit exceeded",
              ErrorCodes.COMMON_TOO_MANY_REQUESTS,
              {
                currentUsage: window.maxRequests,
                maxRequests: window.maxRequests,
                resetInSeconds: window.windowSeconds}
            );
          }
          throw createErr;
        }
      }
      throw mapAwsError(err, "RateLimitStoreDdb.incrementAndCheck");
    }
  }

  /**
   * Creates a new rate limit record if it doesn't exist.
   */
  private async createRecord(key: string, window: RateLimitWindow): Promise<RateLimitUsage> {
    const now = Date.now();
    const windowStart = calculateWindowStart(window.windowSeconds, now);
    const windowEnd = windowStart + window.windowSeconds;
    const ttl = toTtl(window.ttlSeconds);

    const item: DdbRateLimitItem = {
      pk: rateLimitPk(key),
      sk: rateLimitSk(windowStart),
      type: RATE_LIMIT_ENTITY,
      rateLimitKey: key,
      windowStart,
      windowEnd,
      currentUsage: 1,
      maxRequests: window.maxRequests,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      ttl};

    try {
      await this.ddb.put({
        TableName: this.tableName,
        Item: toDdbItem(item),
        ConditionExpression: "attribute_not_exists(pk) AND attribute_not_exists(sk)"});

      return {
        currentUsage: 1,
        maxRequests: window.maxRequests,
        windowStart,
        windowEnd,
        resetInSeconds: windowEnd - Math.floor(now / 1000)};
    } catch (err: any) {
      if (String(err?.name) === "ConditionalCheckFailedException") {
        // Record was created by another request, try to increment
        return this.incrementAndCheck(key, window);
      }
      throw mapAwsError(err, "RateLimitStoreDdb.createRecord");
    }
  }

}

