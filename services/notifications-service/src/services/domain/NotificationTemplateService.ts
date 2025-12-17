/**
 * @fileoverview NotificationTemplateService - Domain service for template rendering
 * @summary Handles template rendering logic for notifications
 * @description Domain service that coordinates template rendering for email notifications,
 * extracting service and event type from metadata and rendering templates with fallback handling.
 */

import type { EmailTemplateService } from '../template';
import type { Logger } from '@lawprotect/shared-ts';
import type { NotificationRequest } from '../../domain/types/orchestrator';
import type { TemplateRenderResult } from '../../domain/types/template';
import { extractServiceFromMetadata, extractEventTypeFromMetadata } from '../../domain/mappers';

/**
 * Domain service for coordinating template rendering
 * 
 * Follows Single Responsibility Principle by focusing exclusively on
 * template rendering coordination.
 */
export class NotificationTemplateService {
  constructor(
    private readonly emailTemplateService: EmailTemplateService,
    private readonly logger: Logger
  ) {}

  /**
   * @description Renders email template for a notification request
   * @param {NotificationRequest} request - Notification request
   * @param {Record<string, unknown>} [metadata] - Optional event metadata
   * @returns {Promise<TemplateRenderResult>} Rendered template result
   */
  async renderEmailTemplate(
    request: NotificationRequest,
    metadata?: Record<string, unknown>
  ): Promise<TemplateRenderResult> {
    try {
      const serviceName = extractServiceFromMetadata(metadata);
      const eventType = extractEventTypeFromMetadata(metadata);

      const templateResult = await this.emailTemplateService.render(
        serviceName,
        eventType,
        request
      );

      return {
        subject: templateResult.subject,
        htmlBody: templateResult.htmlBody,
        textBody: templateResult.textBody
      };
    } catch (error) {
      this.logger.warn('Failed to render email template, using default', {
        recipient: request.recipient,
        error: error instanceof Error ? error.message : String(error)
      });

      return {
        subject: request.subject || 'Notification',
        htmlBody: request.body,
        textBody: request.body
      };
    }
  }
}

