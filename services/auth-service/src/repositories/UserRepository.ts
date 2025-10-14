/**
 * @fileoverview UserRepository - Data access for User entity
 * @summary Handles User entity persistence operations
 * @description Provides data access methods for User entity using Prisma,
 * including CRUD operations and business queries.
 */

import { PrismaClient } from '@prisma/client';
import { User } from '../domain/entities/User';
import { UserId } from '../domain/value-objects/UserId';
import { CognitoSub } from '../domain/value-objects/CognitoSub';
import { UserRole, UserAccountStatus } from '../domain/enums';
import { userNotFound, repositoryError } from '../auth-errors/factories';

/**
 * Repository for User entity persistence
 * 
 * Handles all database operations for User entity.
 */
export class UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Finds user by Cognito sub
   * @param cognitoSub - Cognito subject identifier
   * @returns User entity or undefined if not found
   */
  async findByCognitoSub(cognitoSub: string): Promise<User | undefined> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { cognitoSub }
      });

      return user ? User.fromPersistence(user) : undefined;
    } catch (error) {
      throw repositoryError({ 
        cause: `Failed to find user by Cognito sub: ${error instanceof Error ? error.message : String(error)}` 
      });
    }
  }

  /**
   * Finds user by ID
   * @param id - User ID
   * @returns User entity or undefined if not found
   */
  async findById(id: string): Promise<User | undefined> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id }
      });

      return user ? User.fromPersistence(user) : undefined;
    } catch (error) {
      throw repositoryError({ 
        cause: `Failed to find user by ID: ${error instanceof Error ? error.message : String(error)}` 
      });
    }
  }

  /**
   * Creates a new user
   * @param data - User creation data
   * @returns Created User entity
   */
  async create(data: {
    cognitoSub: string;
    email?: string;
    givenName?: string;
    lastName?: string;
    role: UserRole;
    status: UserAccountStatus;
    mfaEnabled: boolean;
    lastLoginAt: Date;
  }): Promise<User> {
    try {
      const user = await this.prisma.user.create({
        data: {
          cognitoSub: data.cognitoSub,
          email: data.email,
          name: `${data.givenName || ''} ${data.lastName || ''}`.trim(),
          givenName: data.givenName,
          lastName: data.lastName,
          role: data.role,
          status: data.status,
          mfaEnabled: data.mfaEnabled,
          lastLoginAt: data.lastLoginAt
        }
      });

      return User.fromPersistence(user);
    } catch (error) {
      throw repositoryError({ 
        cause: `Failed to create user: ${error instanceof Error ? error.message : String(error)}` 
      });
    }
  }

  /**
   * Updates an existing user
   * @param id - User ID
   * @param data - User update data
   * @returns Updated User entity
   */
  async update(id: string, data: Partial<{
    email: string;
    givenName: string;
    lastName: string;
    mfaEnabled: boolean;
    lastLoginAt: Date;
  }>): Promise<User> {
    try {
      const user = await this.prisma.user.update({
        where: { id },
        data: {
          ...data,
          name: data.givenName && data.lastName 
            ? `${data.givenName} ${data.lastName}`.trim()
            : undefined,
          updatedAt: new Date()
        }
      });

      return User.fromPersistence(user);
    } catch (error) {
      throw repositoryError({ 
        cause: `Failed to update user: ${error instanceof Error ? error.message : String(error)}` 
      });
    }
  }

  /**
   * Updates user status
   * @param id - User ID
   * @param status - New status
   * @returns Updated User entity
   */
  async updateStatus(id: string, status: UserAccountStatus): Promise<User> {
    try {
      const user = await this.prisma.user.update({
        where: { id },
        data: {
          status,
          updatedAt: new Date()
        }
      });

      return User.fromPersistence(user);
    } catch (error) {
      throw repositoryError({ 
        cause: `Failed to update user status: ${error instanceof Error ? error.message : String(error)}` 
      });
    }
  }

  /**
   * Updates user role
   * @param id - User ID
   * @param role - New role
   * @returns Updated User entity
   */
  async updateRole(id: string, role: UserRole): Promise<User> {
    try {
      const user = await this.prisma.user.update({
        where: { id },
        data: {
          role,
          updatedAt: new Date()
        }
      });

      return User.fromPersistence(user);
    } catch (error) {
      throw repositoryError({ 
        cause: `Failed to update user role: ${error instanceof Error ? error.message : String(error)}` 
      });
    }
  }

  /**
   * Deletes a user (soft delete)
   * @param id - User ID
   * @returns Updated User entity
   */
  async delete(id: string): Promise<User> {
    try {
      const user = await this.prisma.user.update({
        where: { id },
        data: {
          status: UserAccountStatus.DELETED,
          deletedAt: new Date(),
          updatedAt: new Date()
        }
      });

      return User.fromPersistence(user);
    } catch (error) {
      throw repositoryError({ 
        cause: `Failed to delete user: ${error instanceof Error ? error.message : String(error)}` 
      });
    }
  }
}
