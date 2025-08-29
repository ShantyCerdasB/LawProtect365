/**
 * Minimal read-model for documents returned to controllers/use-cases.
 * Keep it lean and reusable across adapters.
 */
import type { AllowedContentType } from "@/domain/values/enums";

export type DocumentHead = {
  id: string;                         // stable identifier
  name: string;                       // display name
  contentType: AllowedContentType | string; // MIME (lenient on adapter)
  createdAt: string;                  // ISO string
};
