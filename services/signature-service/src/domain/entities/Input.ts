/**
 * @file Input entity.
 * @description
 * Represents an action or field placed on a document for a party,
 * such as a signature, initials, text box, or date input.
 */

export type InputType = "signature" | "initials" | "text" | "date";

/**
 * Position of the input on a document page.
 */
export interface InputPosition {
  /** Page number (1-based). */
  page: number;
  /** X coordinate (normalized 0–1 or absolute). */
  x: number;
  /** Y coordinate (normalized 0–1 or absolute). */
  y: number;
}

/**
 * Input domain entity.
 */
export interface Input {
  /** Unique identifier of the input. */
  inputId: string;
  /** Envelope the input belongs to. */
  envelopeId: string;
  /** Document the input belongs to. */
  documentId: string;
  /** Party ID assigned to this input. */
  partyId: string;
  /** Input type (signature, initials, text, date). */
  type: InputType;
  /** Whether the input is mandatory. */
  required: boolean;
  /** Page and coordinates. */
  position: InputPosition;
  /** Optional user-provided value. */
  value?: string;
  /** Creation timestamp (ISO string). */
  createdAt: string;
  /** Last update timestamp (ISO string). */
  updatedAt: string;
}
