/**
 * @file Reminders.schema.ts
 * @summary Request schema for sending reminders to parties.
 * @description Defines the request body structure for sending reminder notifications to pending parties.
 */

import { z } from "@lawprotect/shared-ts";

/**
 * @description Body payload for sending reminders to parties.
 * Allows sending reminders to specific parties or all pending parties.
 */
export const RemindersBody = z.object({
  /** Optional array of specific party IDs to remind. If not provided, all pending parties will be reminded. */
  partyIds: z.array(z.string().uuid()).optional(),
  /** Optional custom message to include in the reminder notification. */
  message: z.string().max(500, "Message must be 500 characters or less").optional(),
});

export type RemindersBody = z.infer<typeof RemindersBody>;

