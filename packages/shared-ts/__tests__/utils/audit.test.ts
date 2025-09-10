/**
 * @file audit.test.ts
 * @summary Tests for audit utilities
 */

import { formatActor, type AuditActor, type AuditContext } from '../../src/utils/audit.js';
import type { TenantId, UserId } from '../../src/types/brand.js';

describe('audit utilities', () => {
  describe('formatActor', () => {
    it('should return email when available', () => {
      const actor: AuditActor = {
        email: 'user@example.com',
        userId: 'user-123' as UserId};

      expect(formatActor(actor)).toBe('user@example.com');
    });

    it('should return userId when email is not available', () => {
      const actor: AuditActor = {
        userId: 'user-123' as UserId};

      expect(formatActor(actor)).toBe('user-123');
    });

    it('should return "system" when neither email nor userId is available', () => {
      const actor: AuditActor = {};

      expect(formatActor(actor)).toBe('system');
    });

    it('should return "system" for empty actor', () => {
      const actor: AuditActor = {
        email: '',
        userId: '' as UserId};

      expect(formatActor(actor)).toBe('system');
    });

    it('should prioritize email over userId', () => {
      const actor: AuditActor = {
        email: 'admin@example.com',
        userId: 'admin-456' as UserId};

      expect(formatActor(actor)).toBe('admin@example.com');
    });

    it('should handle actor with only email', () => {
      const actor: AuditActor = {
        email: 'test@example.com'};

      expect(formatActor(actor)).toBe('test@example.com');
    });

    it('should handle actor with only userId', () => {
      const actor: AuditActor = {
        userId: 'test-user-789' as UserId};

      expect(formatActor(actor)).toBe('test-user-789');
    });

    it('should handle actor with null values', () => {
      const actor: AuditActor = {
        email: null as any,
        userId: null as any};

      expect(formatActor(actor)).toBe('system');
    });

    it('should handle actor with undefined values', () => {
      const actor: AuditActor = {
        email: undefined,
        userId: undefined};

      expect(formatActor(actor)).toBe('system');
    });
  });

  describe('AuditActor interface', () => {
    it('should be compatible with ActorContext', () => {
      const actor: AuditActor = {
        email: 'test@example.com',
        userId: 'user-123' as UserId};

      expect(actor.email).toBe('test@example.com');
      expect(actor.userId).toBe('user-123');
    });
  });

  describe('AuditContext interface', () => {
    it('should accept valid audit context', () => {
      const context: AuditContext = {
        envelopeId: 'envelope-456',
        actor: {
          email: 'user@example.com',
          userId: 'user-789' as UserId}};

      expect(context).toBe('tenant-123');
      expect(context.envelopeId).toBe('envelope-456');
      expect(context.actor?.email).toBe('user@example.com');
    });

    it('should accept audit context without optional fields', () => {
      const context: AuditContext = {
        };

      expect(context).toBe('tenant-123');
      expect(context.envelopeId).toBeUndefined();
      expect(context.actor).toBeUndefined();
    });

    it('should accept audit context with only envelopeId', () => {
      const context: AuditContext = {
        envelopeId: 'envelope-456'};

      expect(context).toBe('tenant-123');
      expect(context.envelopeId).toBe('envelope-456');
      expect(context.actor).toBeUndefined();
    });

    it('should accept audit context with only actor', () => {
      const context: AuditContext = {
        actor: {
          userId: 'user-789' as UserId}};

      expect(context).toBe('tenant-123');
      expect(context.envelopeId).toBeUndefined();
      expect(context.actor?.userId).toBe('user-789');
    });
  });
});
