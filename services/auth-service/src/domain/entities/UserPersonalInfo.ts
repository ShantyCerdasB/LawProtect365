/**
 * @fileoverview UserPersonalInfo - Domain entity for user personal information
 * @summary Entity representing user's personal information like phone, locale, timezone
 * @description This entity handles user personal information that is separate from core user data
 * to maintain privacy and allow optional personalization features.
 */

import { UserId } from '../value-objects/UserId';

export class UserPersonalInfo {
  constructor(
    private readonly id: string,
    private readonly userId: UserId,
    private readonly phone: string | null,
    private readonly locale: string | null,
    private readonly timeZone: string | null,
    private readonly createdAt: Date,
    private readonly updatedAt: Date
  ) {}

  /**
   * Creates UserPersonalInfo from persistence model
   * @param data - Persistence model data
   * @returns UserPersonalInfo entity
   */
  static fromPersistence(data: any): UserPersonalInfo {
    return new UserPersonalInfo(
      data.id,
      UserId.fromString(data.userId),
      data.phone,
      data.locale,
      data.timeZone,
      new Date(data.createdAt),
      new Date(data.updatedAt)
    );
  }

  /**
   * Converts entity to persistence model
   * @returns Persistence model data
   */
  toPersistence(): any {
    return {
      id: this.id,
      userId: this.userId.toString(),
      phone: this.phone,
      locale: this.locale,
      timeZone: this.timeZone,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  getId(): string {
    return this.id;
  }

  getUserId(): UserId {
    return this.userId;
  }

  getPhone(): string | null {
    return this.phone;
  }

  getLocale(): string | null {
    return this.locale;
  }

  getTimeZone(): string | null {
    return this.timeZone;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  /**
   * Updates personal information
   * @param updates - Partial updates for personal info
   * @returns New UserPersonalInfo with updates
   */
  update(updates: {
    phone?: string | null;
    locale?: string | null;
    timeZone?: string | null;
  }): UserPersonalInfo {
    return new UserPersonalInfo(
      this.id,
      this.userId,
      updates.phone !== undefined ? updates.phone : this.phone,
      updates.locale !== undefined ? updates.locale : this.locale,
      updates.timeZone !== undefined ? updates.timeZone : this.timeZone,
      this.createdAt,
      new Date()
    );
  }
}