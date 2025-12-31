/**
 * @fileoverview Role.test.ts - Unit tests for Role entity
 * @summary Tests for Role entity behavior
 * @description Tests the Role entity including creation, permissions, and business methods.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { Role } from '../../../src/domain/entities/Role';
import { UserRole } from '../../../src/domain/enums/UserRole';

describe('Role', () => {
  let createdAt: Date;
  let updatedAt: Date;

  beforeEach(() => {
    createdAt = new Date('2024-01-01T00:00:00Z');
    updatedAt = new Date('2024-01-01T00:00:00Z');
  });

  describe('constructor', () => {
    it('should create a Role instance with all required fields', () => {
      const role = new Role(
        'role-id-123',
        UserRole.CUSTOMER,
        'Customer',
        'Regular customer role',
        ['read:profile', 'write:profile'],
        false,
        createdAt,
        updatedAt
      );

      expect(role.getId()).toBe('role-id-123');
      expect(role.getName()).toBe(UserRole.CUSTOMER);
      expect(role.getDisplayName()).toBe('Customer');
      expect(role.getDescription()).toBe('Regular customer role');
      expect(role.getPermissions()).toEqual(['read:profile', 'write:profile']);
      expect(role.getIsSystemRole()).toBe(false);
    });

    it('should create a system role', () => {
      const role = new Role(
        'role-id-456',
        UserRole.ADMIN,
        'Administrator',
        'System administrator role',
        ['read:*', 'write:*', 'delete:*'],
        true,
        createdAt,
        updatedAt
      );

      expect(role.getIsSystemRole()).toBe(true);
      expect(role.getPermissions()).toEqual(['read:*', 'write:*', 'delete:*']);
    });
  });

  describe('fromPersistence', () => {
    it('should create Role from persistence data', () => {
      const persistenceData = {
        id: 'role-id-123',
        name: UserRole.LAWYER,
        displayName: 'Lawyer',
        description: 'Legal professional role',
        permissions: ['read:documents', 'write:documents', 'read:clients'],
        isSystemRole: false,
        createdAt,
        updatedAt
      };

      const role = Role.fromPersistence(persistenceData);

      expect(role.getId()).toBe('role-id-123');
      expect(role.getName()).toBe(UserRole.LAWYER);
      expect(role.getDisplayName()).toBe('Lawyer');
      expect(role.getDescription()).toBe('Legal professional role');
      expect(role.getPermissions()).toEqual(['read:documents', 'write:documents', 'read:clients']);
      expect(role.getIsSystemRole()).toBe(false);
    });

    it('should handle empty permissions array', () => {
      const persistenceData = {
        id: 'role-id-123',
        name: UserRole.UNASSIGNED,
        displayName: 'Unassigned',
        description: 'No role assigned',
        permissions: null,
        isSystemRole: false,
        createdAt,
        updatedAt
      };

      const role = Role.fromPersistence(persistenceData);

      expect(role.getPermissions()).toEqual([]);
    });

    it('should default isSystemRole to false if not provided', () => {
      const persistenceData = {
        id: 'role-id-123',
        name: UserRole.CUSTOMER,
        displayName: 'Customer',
        description: 'Customer role',
        permissions: [],
        createdAt,
        updatedAt
      };

      const role = Role.fromPersistence(persistenceData);

      expect(role.getIsSystemRole()).toBe(false);
    });
  });

  describe('getters', () => {
    let role: Role;

    beforeEach(() => {
      role = new Role(
        'role-id-123',
        UserRole.CUSTOMER,
        'Customer',
        'Regular customer role',
        ['read:profile', 'write:profile'],
        false,
        createdAt,
        updatedAt
      );
    });

    it('should return correct id', () => {
      expect(role.getId()).toBe('role-id-123');
    });

    it('should return correct name', () => {
      expect(role.getName()).toBe(UserRole.CUSTOMER);
    });

    it('should return correct displayName', () => {
      expect(role.getDisplayName()).toBe('Customer');
    });

    it('should return correct description', () => {
      expect(role.getDescription()).toBe('Regular customer role');
    });

    it('should return permissions array copy', () => {
      const permissions = role.getPermissions();
      permissions.push('new:permission');

      expect(role.getPermissions()).not.toContain('new:permission');
      expect(role.getPermissions()).toEqual(['read:profile', 'write:profile']);
    });

    it('should return correct createdAt', () => {
      expect(role.getCreatedAt()).toEqual(createdAt);
    });

    it('should return correct updatedAt', () => {
      expect(role.getUpdatedAt()).toEqual(updatedAt);
    });
  });

  describe('hasPermission', () => {
    let role: Role;

    beforeEach(() => {
      role = new Role(
        'role-id-123',
        UserRole.LAWYER,
        'Lawyer',
        'Legal professional',
        ['read:documents', 'write:documents', 'read:clients'],
        false,
        createdAt,
        updatedAt
      );
    });

    it('should return true when role has the permission', () => {
      expect(role.hasPermission('read:documents')).toBe(true);
      expect(role.hasPermission('write:documents')).toBe(true);
      expect(role.hasPermission('read:clients')).toBe(true);
    });

    it('should return false when role does not have the permission', () => {
      expect(role.hasPermission('delete:documents')).toBe(false);
      expect(role.hasPermission('admin:all')).toBe(false);
    });
  });

  describe('hasAnyPermission', () => {
    let role: Role;

    beforeEach(() => {
      role = new Role(
        'role-id-123',
        UserRole.ADMIN,
        'Administrator',
        'System administrator',
        ['read:*', 'write:*', 'delete:*'],
        true,
        createdAt,
        updatedAt
      );
    });

    it('should return true when role has at least one permission', () => {
      expect(role.hasAnyPermission(['read:*', 'unknown:permission'])).toBe(true);
      expect(role.hasAnyPermission(['write:*'])).toBe(true);
    });

    it('should return false when role has none of the permissions', () => {
      expect(role.hasAnyPermission(['unknown:permission', 'another:unknown'])).toBe(false);
    });

    it('should return true when role has all permissions', () => {
      expect(role.hasAnyPermission(['read:*', 'write:*', 'delete:*'])).toBe(true);
    });
  });

  describe('updateInfo', () => {
    let role: Role;

    beforeEach(() => {
      role = new Role(
        'role-id-123',
        UserRole.CUSTOMER,
        'Customer',
        'Regular customer role',
        ['read:profile'],
        false,
        createdAt,
        updatedAt
      );
    });

    it('should update displayName, description, and permissions', () => {
      role.updateInfo(
        'Premium Customer',
        'Premium customer with enhanced features',
        ['read:profile', 'write:profile', 'read:documents']
      );

      expect(role.getDisplayName()).toBe('Premium Customer');
      expect(role.getDescription()).toBe('Premium customer with enhanced features');
      expect(role.getPermissions()).toEqual(['read:profile', 'write:profile', 'read:documents']);
    });

    it('should update updatedAt timestamp', () => {
      const beforeUpdate = new Date();
      role.updateInfo('Updated Customer', 'Updated description', ['read:profile']);
      const afterUpdate = new Date();

      const updated = role.getUpdatedAt();
      expect(updated.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());
      expect(updated.getTime()).toBeLessThanOrEqual(afterUpdate.getTime());
    });
  });

  describe('different roles', () => {
    it('should create UNASSIGNED role', () => {
      const role = new Role(
        'role-id-123',
        UserRole.UNASSIGNED,
        'Unassigned',
        'No role assigned',
        [],
        false,
        createdAt,
        updatedAt
      );

      expect(role.getName()).toBe(UserRole.UNASSIGNED);
    });

    it('should create SUPER_ADMIN role', () => {
      const role = new Role(
        'role-id-123',
        UserRole.SUPER_ADMIN,
        'Super Administrator',
        'Full system access',
        ['*'],
        true,
        createdAt,
        updatedAt
      );

      expect(role.getName()).toBe(UserRole.SUPER_ADMIN);
      expect(role.getIsSystemRole()).toBe(true);
    });

    it('should create EXTERNAL_USER role', () => {
      const role = new Role(
        'role-id-123',
        UserRole.EXTERNAL_USER,
        'External User',
        'External integration user',
        ['read:public'],
        false,
        createdAt,
        updatedAt
      );

      expect(role.getName()).toBe(UserRole.EXTERNAL_USER);
    });
  });
});









