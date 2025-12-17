/**
 * @fileoverview EmailTemplateService - Service for rendering email templates
 * @summary Handles email template loading and rendering with i18n support
 * @description This service loads email templates from the filesystem and renders
 * them with variables and i18n support. Templates are stored as files in the codebase.
 */

import * as fs from 'fs';
import * as path from 'path';
import type { NotificationRequest } from '../../domain/types/orchestrator';
import type { TemplateRenderResult } from '../../domain/types/template';
import { templateRenderFailed } from '../../notification-errors';

/**
 * Service for rendering email templates with i18n support
 * 
 * Templates are stored in: templates/email/{service}/{event-type}/{lang}.html
 * Subject templates: templates/email/{service}/{event-type}/subject.{lang}.txt
 */
export class EmailTemplateService {
  private readonly templatesBasePath: string;

  constructor(templatesBasePath?: string) {
    this.templatesBasePath = templatesBasePath || path.join(__dirname, '../../../templates/email');
  }

  /**
   * @description Renders an email template for a notification request
   * @param {string} service - Service name (e.g., 'signature-service', 'auth-service')
   * @param {string} eventType - Event type (e.g., 'ENVELOPE_INVITATION', 'UserRegistered')
   * @param {NotificationRequest} request - Notification request with variables
   * @returns {Promise<TemplateRenderResult>} Rendered template with subject and body
   * @throws {Error} When template file is not found or rendering fails
   */
  async render(
    service: string,
    eventType: string,
    request: NotificationRequest
  ): Promise<TemplateRenderResult> {
    const language = request.language || 'en';
    const normalizedEventType = this.normalizeEventType(eventType);
    
    const templatePath = path.join(
      this.templatesBasePath,
      service,
      normalizedEventType,
      `${language}.html`
    );
    
    const subjectPath = path.join(
      this.templatesBasePath,
      service,
      normalizedEventType,
      `subject.${language}.txt`
    );

    let htmlBody = request.htmlBody || request.body;
    let subject = request.subject || 'Notification';

    try {
      if (fs.existsSync(templatePath)) {
        htmlBody = await this.renderTemplate(templatePath, request);
      }

      if (fs.existsSync(subjectPath)) {
        subject = await this.renderTemplate(subjectPath, request);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw templateRenderFailed({
        service,
        eventType,
        recipient: request.recipient,
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      });
    }

    return {
      subject: subject.trim(),
      htmlBody: htmlBody.trim(),
      textBody: this.htmlToText(htmlBody)
    };
  }

  /**
   * @description Renders a template file with variables
   * @param {string} templatePath - Path to template file
   * @param {NotificationRequest} request - Request with variables
   * @returns {Promise<string>} Rendered template
   */
  private async renderTemplate(templatePath: string, request: NotificationRequest): Promise<string> {
    const templateContent = await fs.promises.readFile(templatePath, 'utf-8');
    return this.interpolate(templateContent, {
      ...request.metadata,
      recipient: request.recipient,
      subject: request.subject,
      body: request.body
    });
  }

  /**
   * @description Interpolates variables in template string
   * @param {string} template - Template string with {{variable}} placeholders
   * @param {Record<string, unknown>} variables - Variables to interpolate
   * @returns {string} Interpolated string
   */
  private interpolate(template: string, variables: Record<string, unknown>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      const value = variables[key];
      return value !== undefined && value !== null ? String(value) : match;
    });
  }

  /**
   * @description Converts HTML to plain text (simple implementation)
   * @param {string} html - HTML string
   * @returns {string} Plain text
   */
  private htmlToText(html: string): string {
    return html
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
  }

  /**
   * @description Normalizes event type to filesystem-safe name
   * @param {string} eventType - Event type
   * @returns {string} Normalized event type
   */
  private normalizeEventType(eventType: string): string {
    return eventType.toLowerCase().replace(/_/g, '-');
  }
}

