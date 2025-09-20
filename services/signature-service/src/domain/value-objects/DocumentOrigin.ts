/**
 * @fileoverview DocumentOrigin value object - Represents the origin of a document
 * @summary Encapsulates document origin logic and validation
 * @description The DocumentOrigin value object defines how a document was created,
 * either from user upload or from a template, and provides business logic for origin handling.
 */

import { DocumentOriginType } from '@prisma/client';
import { BadRequestError } from '@lawprotect/shared-ts';

/**
 * DocumentOrigin value object
 * 
 * Represents the origin of a document in the signing process.
 * Defines whether the document was uploaded by a user or generated from a template.
 */
export class DocumentOrigin {
  constructor(
    private readonly type: DocumentOriginType,
    private readonly templateId?: string,
    private readonly templateVersion?: string
  ) {
    // Validate template fields when origin is TEMPLATE
    if (type === DocumentOriginType.TEMPLATE) {
      if (!templateId || !templateVersion) {
        throw new BadRequestError('Template ID and version are required for template documents', 'INVALID_TEMPLATE_ORIGIN');
      }
    }
  }

  /**
   * Creates a DocumentOrigin for user upload
   */
  static userUpload(): DocumentOrigin {
    return new DocumentOrigin(DocumentOriginType.USER_UPLOAD);
  }

  /**
   * Creates a DocumentOrigin for template
   * @param templateId - The template ID
   * @param templateVersion - The template version
   */
  static template(templateId: string, templateVersion: string): DocumentOrigin {
    return new DocumentOrigin(DocumentOriginType.TEMPLATE, templateId, templateVersion);
  }

  /**
   * Creates a DocumentOrigin from a string value
   * @param type - The origin type string
   * @param templateId - Optional template ID
   * @param templateVersion - Optional template version
   */
  static fromString(type: string, templateId?: string, templateVersion?: string): DocumentOrigin {
    if (!Object.values(DocumentOriginType).includes(type as DocumentOriginType)) {
      throw new BadRequestError('Invalid DocumentOriginType string', 'INVALID_DOCUMENT_ORIGIN_TYPE');
    }
    return new DocumentOrigin(type as DocumentOriginType, templateId, templateVersion);
  }

  /**
   * Gets the origin type
   */
  getType(): DocumentOriginType {
    return this.type;
  }

  /**
   * Gets the template ID if applicable
   */
  getTemplateId(): string | undefined {
    return this.templateId;
  }

  /**
   * Gets the template version if applicable
   */
  getTemplateVersion(): string | undefined {
    return this.templateVersion;
  }

  /**
   * Checks if this is a user upload origin
   */
  isUserUpload(): boolean {
    return this.type === DocumentOriginType.USER_UPLOAD;
  }

  /**
   * Checks if this is a template origin
   */
  isTemplate(): boolean {
    return this.type === DocumentOriginType.TEMPLATE;
  }

  /**
   * Checks if this origin equals another origin
   * @param other - Other origin to compare
   * @returns true if origins are equal
   */
  equals(other: DocumentOrigin): boolean {
    return this.type === other.type &&
           this.templateId === other.templateId &&
           this.templateVersion === other.templateVersion;
  }

  /**
   * Returns the string representation of the origin
   */
  toString(): string {
    return this.type;
  }

  /**
   * Returns the JSON representation of the origin
   */
  toJSON() {
    return {
      type: this.type,
      templateId: this.templateId,
      templateVersion: this.templateVersion
    };
  }
}
