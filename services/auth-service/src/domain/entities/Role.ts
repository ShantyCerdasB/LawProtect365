/**
 * @fileoverview Role entity - Represents a user role in the system
 * @summary Manages role information and permissions
 * @description The Role entity encapsulates role information including
 * permissions and role hierarchy.
 */

import { UserRole } from '../enums/UserRole';

/**
 * Role entity representing a system role
 * 
 * Manages role information and associated permissions.
 */
export class Role {
  constructor(
    private readonly id: string,
    private readonly name: UserRole,
    private readonly displayName: string,
    private readonly description: string,
    private readonly permissions: string[],
    private readonly isSystemRole: boolean,
    private readonly createdAt: Date,
    private updatedAt: Date
  ) {}

  /**
   * Creates a Role from persistence data
   * @param data - Prisma Role data
   * @returns Role instance
   */
  static fromPersistence(data: any): Role {
    return new Role(
      data.id,
      data.name as UserRole,
      data.displayName,
      data.description,
      data.permissions || [],
      data.isSystemRole || false,
      data.createdAt,
      data.updatedAt
    );
  }

  /**
   * Gets the role unique identifier
   * @returns The role ID
   */
  getId(): string {
    return this.id;
  }

  /**
   * Gets the role name
   * @returns The role name
   */
  getName(): UserRole {
    return this.name;
  }

  /**
   * Gets the role display name
   * @returns The role display name
   */
  getDisplayName(): string {
    return this.displayName;
  }

  /**
   * Gets the role description
   * @returns The role description
   */
  getDescription(): string {
    return this.description;
  }

  /**
   * Gets the role permissions
   * @returns Array of permissions
   */
  getPermissions(): string[] {
    return [...this.permissions];
  }

  /**
   * Checks if role has a specific permission
   * @param permission - Permission to check
   * @returns True if role has the permission
   */
  hasPermission(permission: string): boolean {
    return this.permissions.includes(permission);
  }

  /**
   * Checks if role has any of the specified permissions
   * @param permissions - Permissions to check
   * @returns True if role has any of the permissions
   */
  hasAnyPermission(permissions: string[]): boolean {
    return permissions.some(permission => this.permissions.includes(permission));
  }

  /**
   * Checks if this is a system role
   * @returns True if this is a system role
   */
  isSystemRole(): boolean {
    return this.isSystemRole;
  }

  /**
   * Gets the creation timestamp
   * @returns The creation timestamp
   */
  getCreatedAt(): Date {
    return this.createdAt;
  }

  /**
   * Gets the last update timestamp
   * @returns The last update timestamp
   */
  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  /**
   * Updates role information
   * @param displayName - New display name
   * @param description - New description
   * @param permissions - New permissions
   */
  updateInfo(displayName: string, description: string, permissions: string[]): void {
    (this as any).displayName = displayName;
    (this as any).description = description;
    (this as any).permissions = permissions;
    (this as any).updatedAt = new Date();
  }
}
