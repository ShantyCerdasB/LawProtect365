/**
 * @file EventBridgePublisher.ts
 * @summary Publishes integration events to Amazon EventBridge.
 * @description
 * - SDK-agnostic: depends on a minimal `EventBridgeClientLike` interface.
 * - Safe error normalization via `mapAwsError` from the shared package.
 * - Uses `stableStringifyUnsafe` to serialize arbitrary envelopes without
 *   forcing them to conform to `JsonValue`.
 *
 * Usage:
 * ```ts
 * const publisher = new EventBridgePublisher({
 *   busName: process.env.EVENT_BUS!,
 *   source: "signature-service",
 *   client: eventBridgeClientV3Adapter, // must implement EventBridgeClientLike
 * });
 *
 * await publisher.publish({
 *   name: "envelope.sent",
 *   meta: { id: ulid(), ts: nowIso(), source: "signature-service" },
 *   data: { envelopeId, ownerId },
 * });
 * ```
 */

import { InternalError, mapAwsError, stableStringifyUnsafe, ErrorCodes } from "@lawprotect/shared-ts";
import type { EventEnvelope } from "@lawprotect/shared-ts";

/**
 * Minimal, SDK-agnostic surface for EventBridge.
 * Implement this with AWS SDK v3 (`PutEventsCommand`) or any compatible client.
 */
export interface EventBridgeClientLike {
  putEvents(input: {
    Entries: Array<{
      Source: string;
      DetailType: string;
      Detail: string;
      EventBusName: string;
      Time?: Date;
      Resources?: string[];
      TraceHeader?: string;
    }>;
  }): Promise<{
    FailedEntryCount?: number;
    Entries?: Array<{
      EventId?: string;
      ErrorCode?: string;
      ErrorMessage?: string;
    }>;
  }>;
}

/** Constructor parameters for the publisher. */
export interface EventBridgePublisherOptions {
  /** Name/ARN of the target EventBridge bus. */
  busName: string;
  /** Logical event source (e.g., `signature-service`). */
  source: string;
  /** Client that satisfies `EventBridgeClientLike`. */
  client: EventBridgeClientLike;
  /**
   * Optional resource ARNs to include in EventBridge entries.
   * Useful for routing patterns/subscriptions.
   */
  resources?: string[];
}

/**
 * Publisher that converts a generic `EventEnvelope` into a single EventBridge entry.
 * Keeps the adapter thin and free of AWS SDK types.
 */
export class EventBridgePublisher {
  private readonly busName: string;
  private readonly source: string;
  private readonly client: EventBridgeClientLike;
  private readonly resources?: string[];

  constructor(opts: EventBridgePublisherOptions) {
    this.busName = opts.busName;
    this.source = opts.source;
    this.client = opts.client;
    this.resources = opts.resources;
  }

  /**
   * Publishes one `EventEnvelope` to EventBridge.
   * @param envelope Structured event (name/meta/data).
   * @returns The EventBridge-assigned `eventId` when available.
   * @throws HttpError (normalized via `mapAwsError`) on provider failures.
   */
  async publish(envelope: EventEnvelope): Promise<{ eventId?: string }> {
    try {
      // Intentionally use the unsafe variant to avoid narrowing `EventEnvelope`
      // to `JsonValue` at call sites; this centralizes the cast here.
      const detail = stableStringifyUnsafe(envelope);

      const res = await this.client.putEvents({
        Entries: [
          {
            Source: this.source,
            DetailType: envelope.name,
            Detail: detail,
            EventBusName: this.busName,
            // Prefer envelope timestamp when present; fall back to now
            Time: envelope?.meta?.ts ? new Date(envelope.meta.ts) : new Date(),
            Resources: this.resources,
            // If you propagate tracing (e.g., AWS X-Ray), attach it here:
            TraceHeader: envelope?.meta?.traceId,
          },
        ],
      });

      // Explicitly surface partial failures even when the call succeeded.
      if (res?.FailedEntryCount && res.FailedEntryCount > 0) {
        const entry = res.Entries?.[0];
        // Use structured `details` for observability and debugging.
        throw new InternalError(
          `EventBridge putEvents reported ${res.FailedEntryCount} failed entr${res.FailedEntryCount === 1 ? "y" : "ies"}`,
          ErrorCodes.COMMON_INTERNAL_ERROR,
          {
            failedCount: res.FailedEntryCount,
            firstError: {
              errorCode: entry?.ErrorCode,
              errorMessage: entry?.ErrorMessage,
            },
          }
        );
      }

      return { eventId: res?.Entries?.[0]?.EventId };
    } catch (err) {
      // Normalize AWS/SDK errors into shared HttpErrors (throttling, access denied, etc.).
      throw mapAwsError(err, "EventBridgePublisher.publish");
    }
  }
}
