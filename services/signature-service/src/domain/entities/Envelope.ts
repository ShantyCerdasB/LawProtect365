/**
 * @file Envelope entity.
 * @description
 * Root aggregate of the signature domain.
 * Owns documents, parties, and inputs. Enforces high-level status transitions.
 */

export type EnvelopeStatus = "draft" | "sent" | "completed" | "cancelled";

/**
 * Envelope domain entity.
 */
export interface Envelope {
  /** Unique identifier of the envelope. */
  envelopeId: string;
  /** Owner userId (creator). */
  ownerId: string;
  /** Human-friendly title. */
  title: string;
  /** Lifecycle status. */
  status: EnvelopeStatus;
  /** ISO8601 creation timestamp. */
  createdAt: string;
  /** ISO8601 last update timestamp. */
  updatedAt: string;
  /** List of associated party IDs. */
  parties: string[];
  /** List of associated document IDs. */
  documents: string[];
}
