/**
 * @file Reminders.schema.ts
 * @summary Request schema for sending reminders to pending parties.
 */

import { z } from "@lawprotect/shared-ts";

/** Body payload for sending reminders. */
export const RemindersBody = z.object({
  message: z.string().max(500).optional(),
  partyIds: z.array(z.string().uuid()).optional()});
export type RemindersBody = z.infer<typeof RemindersBody>;

