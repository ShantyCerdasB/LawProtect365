/**
 * @fileoverview AuditService - Business logic service for audit operations
 * @summary Provides business logic for audit management
 * @description This service handles all business logic for audit operations
 * including creation, validation, and coordination with other services.
 */

import { AuditEvent } from '../domain/types/audit/AuditEvent';
import { AuditEventType } from '../domain/enums/AuditEventType';
import { AuditRepository } from '../repositories/AuditRepository';
import { CreateAuditEventRequest } from '../domain/types/audit/CreateAuditEventRequest';
import { NotFoundError, BadRequestError, ErrorCodes } from '@lawprotect/shared-ts';

/**
 * AuditService implementation
 * 
 * Provides business logic for audit operations including validation,
 * event creation, and audit trail management.
 */
export class AuditService {
  constructor(
    private readonly auditRepository: AuditRepository
  ) {}

  /**
   * Creates a new audit event
   * @param request - The create audit event request
   * @returns The created audit event
   */
  async createEvent(request: CreateAuditEventRequest): Promise<AuditEvent> {
    // Validate business rules
    this.validateCreateAuditEventRequest(request);

    // Save audit event using repository (repository handles entity creation)
    const createdAuditEvent = await this.auditRepository.create(request);

    return createdAuditEvent;
  }

  /**
   * Gets an audit event by ID
   * @param auditEventId - The audit event ID
   * @returns The audit event
   */
  async getAuditEvent(auditEventId: string): Promise<AuditEvent> {
    const auditEvent = await this.auditRepository.getById(auditEventId);
    if (!auditEvent) {
      throw new NotFoundError(
        `Audit event with ID ${auditEventId} not found`,
        ErrorCodes.COMMON_NOT_FOUND
      );
    }

    return auditEvent;
  }

  /**
   * Gets audit trail for an envelope
   * @param envelopeId - The envelope ID
   * @param limit - Maximum number of events to return
   * @param cursor - Pagination cursor
   * @returns List of audit events
   */
  async getAuditTrail(
    envelopeId: string,
    limit: number = 25,
    cursor?: string
  ) {
    return this.auditRepository.listByEnvelope(envelopeId, limit, cursor);
  }

  /**
   * Gets audit trail for a user
   * @param userId - The user ID
   * @param limit - Maximum number of events to return
   * @param cursor - Pagination cursor
   * @returns List of audit events
   */
  async getUserAuditTrail(
    userId: string,
    limit: number = 25,
    cursor?: string
  ) {
    return this.auditRepository.listByUser(userId, limit, cursor);
  }

  /**
   * Gets audit events by type
   * @param eventType - The event type
   * @param limit - Maximum number of events to return
   * @param cursor - Pagination cursor
   * @returns List of audit events
   */
  async getAuditEventsByType(
    eventType: AuditEventType,
    limit: number = 25,
    cursor?: string
  ) {
    return this.auditRepository.listByEventType(eventType, limit, cursor);
  }

  /**
   * Validates create audit event request
   * @param request - The create request
   */
  private validateCreateAuditEventRequest(request: CreateAuditEventRequest): void {
    if (!request.type) {
      throw new BadRequestError(
        'Audit event type is required',
        ErrorCodes.COMMON_BAD_REQUEST
      );
    }

    if (!request.envelopeId || request.envelopeId.trim().length === 0) {
      throw new BadRequestError(
        'Envelope ID is required',
        ErrorCodes.COMMON_BAD_REQUEST
      );
    }

    if (!request.description || request.description.trim().length === 0) {
      throw new BadRequestError(
        'Description is required',
        ErrorCodes.COMMON_BAD_REQUEST
      );
    }
  }

}