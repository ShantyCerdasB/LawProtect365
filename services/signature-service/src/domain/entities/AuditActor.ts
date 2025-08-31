/**
 * @file AuditActor.ts
 * @summary Audit actor entity
 * @description Actor metadata attached to an audit event
 */

/**
 * @summary Actor metadata attached to an audit event
 * @description Contains information about who performed the audited action
 */
export interface AuditActor {
  /** User identifier */
  readonly userId?: string;
  /** User email address */
  readonly email?: string;
  /** IP address of the actor */
  readonly ip?: string;
  /** User agent string */
  readonly userAgent?: string;
  /** User locale preference */
  readonly locale?: string;
}
