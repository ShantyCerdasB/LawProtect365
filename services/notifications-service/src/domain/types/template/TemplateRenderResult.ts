/**
 * @fileoverview TemplateRenderResult - Result type for template rendering
 * @summary Defines the structure for template rendering results
 * @description This interface represents the result of rendering an email template,
 * including the subject, HTML body, and plain text body.
 */

/**
 * Template rendering result containing subject and body in multiple formats
 */
export interface TemplateRenderResult {
  subject: string;
  htmlBody: string;
  textBody: string;
}

