import type { ISODateString } from "./common.js";
import type {  UserId } from "./brand.js";

/**
 * Metadata carried by domain and integration events.
 */
export interface EventMeta {
  /** Event id (ulid/uuid). */
  id: string;
  /** Trace id for correlation across services. */
  traceId?: string;
  /** Event creation timestamp (ISO-8601). */
  ts: ISODateString;
  /** Logical source of the event (service name). */
  source: string;

  /** Actor responsible if applicable. */
  actorId?: UserId;
  /** Arbitrary tags (e.g., region, env). */
  tags?: Record<string, string>;
}

/**
 * Generic event envelope used for message buses and audit logs.
 */
export interface EventEnvelope<TPayload = unknown> {
  name: string;
  meta: EventMeta;
  data: TPayload;
}
