/**
 * @fileoverview DynamoDB mapper utilities - Common mapper functions and utilities
 * @summary Shared utilities for mapping between domain entities and DynamoDB items
 * @description Provides common mapper functions, type guards, and utilities that can be
 * reused across different entity mappers to reduce code duplication.
 */

import type { Mapper } from '@lawprotect/shared-ts';
import { BadRequestError, ErrorCodes } from '@lawprotect/shared-ts';
import type { DdbItem } from './dynamodb-base';
import { DynamoDbPrefixes } from '../../../enums/DynamoDbPrefixes';

/**
 * Generic mapper interface for DynamoDB operations
 * Extends the base Mapper interface with DynamoDB-specific functionality.
 */
export interface DdbMapper<TDomain, TDdbItem extends DdbItem> extends Mapper<TDomain, TDdbItem> {
  /** Type guard to validate DynamoDB item structure */
  isDdbItem(item: unknown): item is TDdbItem;
}

/**
 * Common mapper utilities and helper functions
 */
export class DdbMapperUtils {
  /**
   * Creates a type guard for DynamoDB items
   * @param entityType - The entity type to validate
   * @param requiredFields - Array of required field names
   * @returns Type guard function
   */
  static createTypeGuard<T extends DdbItem>(
    entityType: string,
    requiredFields: string[]
  ): (item: unknown) => item is T {
    return (item: unknown): item is T => {
      const obj = item as Partial<T> | null | undefined;
      
      if (!obj || typeof obj !== 'object') {
        return false;
      }

      // Check entity type
      if (obj.type !== entityType) {
        return false;
      }

      // Check required fields
      for (const field of requiredFields) {
        if (!(field in obj) || obj[field as keyof T] === undefined || obj[field as keyof T] === null) {
          return false;
        }
      }

      return true;
    };
  }

  /**
   * Validates and throws error for invalid DynamoDB items
   * @param item - The item to validate
   * @param entityType - The expected entity type
   * @param typeGuard - The type guard function
   * @throws BadRequestError if item is invalid
   */
  static validateDdbItem<T extends DdbItem>(
    item: unknown,
    entityType: string,
    typeGuard: (item: unknown) => item is T
  ): asserts item is T {
    if (!typeGuard(item)) {
      throw new BadRequestError(
        `Invalid persistence object for ${entityType}`,
        ErrorCodes.COMMON_BAD_REQUEST,
        { item }
      );
    }
  }

  /**
   * Creates a frozen domain object
   * @param obj - The object to freeze
   * @returns Frozen object
   */
  static freezeDomainObject<T>(obj: T): T {
    return Object.freeze(obj);
  }

  /**
   * Safely converts a date to ISO string
   * @param date - The date to convert
   * @returns ISO string or undefined
   */
  static toIsoString(date: Date | undefined): string | undefined {
    return date?.toISOString();
  }

  /**
   * Safely converts an ISO string to Date
   * @param isoString - The ISO string to convert
   * @returns Date or undefined
   */
  static fromIsoString(isoString: string | undefined): Date | undefined {
    return isoString ? new Date(isoString) : undefined;
  }

  /**
   * Calculates TTL from expiration date
   * @param expiresAt - The expiration date
   * @returns TTL timestamp or undefined
   */
  static calculateTTL(expiresAt: Date | undefined): number | undefined {
    return expiresAt ? Math.floor(expiresAt.getTime() / 1000) : undefined;
  }

  /**
   * Creates a mapper with common utilities
   * @param entityType - The entity type name
   * @param requiredFields - Array of required field names
   * @param toDTO - Function to convert domain to DTO
   * @param fromDTO - Function to convert DTO to domain
   * @returns Complete mapper with type guard
   */
  static createMapper<TDomain, TDdbItem extends DdbItem>(
    entityType: string,
    requiredFields: string[],
    toDTO: (domain: TDomain) => TDdbItem,
    fromDTO: (dto: TDdbItem) => TDomain
  ): DdbMapper<TDomain, TDdbItem> {
    const typeGuard = this.createTypeGuard<TDdbItem>(entityType, requiredFields);

    return {
      toDTO,
      fromDTO: (dto: TDdbItem) => {
        this.validateDdbItem(dto, entityType, typeGuard);
        return fromDTO(dto);
      },
      isDdbItem: typeGuard
    };
  }
}

/**
 * Common key builders for DynamoDB operations
 */
export class DdbKeyBuilders {
  /**
   * Builds partition key for entities
   * @param entityType - The entity type
   * @param id - The entity identifier
   * @returns Partition key string
   */
  static buildPk(entityType: string, id: string): string {
    return `${entityType.toUpperCase()}#${id}`;
  }

  /**
   * Builds sort key for entities
   * @param subType - The sub-type or category
   * @param id - The identifier
   * @returns Sort key string
   */
  static buildSk(subType: string, id: string): string {
    return `${subType.toUpperCase()}#${id}`;
  }

  /**
   * Builds GSI partition key for owner queries
   * @param ownerId - The owner identifier
   * @returns GSI partition key string
   */
  static buildOwnerGsiPk(ownerId: string): string {
    return `${DynamoDbPrefixes.OWNER}${ownerId}`;
  }

  /**
   * Builds GSI sort key for status and date sorting
   * @param status - The status
   * @param createdAt - The creation timestamp
   * @param id - The entity identifier
   * @returns GSI sort key string
   */
  static buildStatusGsiSk(status: string, createdAt: string, id: string): string {
    return `${status}#${createdAt}#${id}`;
  }

  /**
   * Builds GSI sort key for date sorting
   * @param createdAt - The creation timestamp
   * @param id - The entity identifier
   * @returns GSI sort key string
   */
  static buildDateGsiSk(createdAt: string, id: string): string {
    return `${createdAt}#${id}`;
  }
}
