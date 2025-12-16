/**
 * @fileoverview Signature Field Types - Types for signature field assignment
 * @summary Type definitions for signature fields assigned to signers
 * @description
 * Defines types for signature fields that can be assigned to specific signers
 * in a PDF document, allowing precise control over where each signer can sign.
 */

import type { PDFCoordinates } from '../../documents/types';

/**
 * @description Signature field type.
 */
export enum SignatureFieldType {
  /**
   * @description Signature field (for drawing/writing signature).
   */
  SIGNATURE = 'SIGNATURE',
  /**
   * @description Initials field.
   */
  INITIALS = 'INITIALS',
  /**
   * @description Date field.
   */
  DATE = 'DATE',
  /**
   * @description Text field.
   */
  TEXT = 'TEXT',
}

/**
 * @description Signature field assigned to a signer.
 */
export interface SignatureField {
  /**
   * @description Unique field ID.
   */
  id: string;
  /**
   * @description Field type.
   */
  type: SignatureFieldType;
  /**
   * @description PDF coordinates where field is placed.
   */
  coordinates: PDFCoordinates;
  /**
   * @description Field width in PDF units.
   */
  width: number;
  /**
   * @description Field height in PDF units.
   */
  height: number;
  /**
   * @description Signer email this field is assigned to.
   */
  assignedToSignerEmail: string;
  /**
   * @description Optional field label/name.
   */
  label?: string;
  /**
   * @description Whether field is required.
   */
  required: boolean;
}

/**
 * @description Signer with assigned signature fields.
 */
export interface SignerWithFields {
  /**
   * @description Signer email.
   */
  email: string;
  /**
   * @description Signer full name.
   */
  fullName: string;
  /**
   * @description Whether signer is external.
   */
  isExternal: boolean;
  /**
   * @description Optional user ID.
   */
  userId?: string;
  /**
   * @description Optional signing order.
   */
  order?: number;
  /**
   * @description Signature fields assigned to this signer.
   */
  fields: SignatureField[];
}

