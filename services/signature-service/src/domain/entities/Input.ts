/**
 * @file Input.ts
 * @summary Input domain entity for document fields and actions
 * @description Input domain entity representing actions or fields placed on documents for parties.
 * Defines signature, initials, text boxes, date inputs, and other interactive elements on documents.
 */

/**
 * @file Input entity.
 * @description
 * Represents an action or field placed on a document for a party,
 * such as a signature, initials, text box, or date input.
 */

import { InputType } from "../values/enums";

/**
 * @description Position of the input on a document page.
 * Defines the location coordinates and page number for placing inputs on documents.
 */
export interface InputPosition {
  /** Page number (1-based) */
  page: number;
  /** X coordinate (normalized 0–1 or absolute) */
  x: number;
  /** Y coordinate (normalized 0–1 or absolute) */
  y: number;
}

/**
 * @description Input domain entity representing an action or field on a document.
 * Contains metadata about the input type, position, assignment, and state.
 */
export interface Input {
  /** Unique identifier of the input */
  inputId: string;
  /** Envelope the input belongs to */
  envelopeId: string;
  /** Document the input belongs to */
  documentId: string;
  /** Party ID assigned to this input */
  partyId: string;
  /** Input type (signature, initials, text, date) */
  type: InputType;
  /** Whether the input is mandatory */
  required: boolean;
  /** Page and coordinates */
  position: InputPosition;
  /** Optional user-provided value */
  value?: string;
  /** Creation timestamp (ISO string) */
  createdAt: string;
  /** Last update timestamp (ISO string) */
  updatedAt: string;
}
