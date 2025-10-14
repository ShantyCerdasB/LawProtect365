/**
 * @fileoverview UserPersonalInfo entity - Personal information for users
 * @summary Manages user personal information like phone, locale, timezone
 * @description The UserPersonalInfo entity encapsulates personal information
 * that can grow over time without affecting the core User entity.
 */

import { UserId } from '../value-objects/UserId';

/**
 * UserPersonalInfo entity representing personal user information
 * 
 * Manages personal information like phone, locale, timezone that can
 * be extended without affecting the core User entity.
 */
export class UserPersonalInfo {
  constructor(
    private readonly id: string,
    private readonly userId: UserId,
    private phone: string | undefined,
    private locale: string | undefined,
    private timeZone: string | undefined,
    private readonly createdAt: Date,
    private updatedAt: Date
  ) {}

  /**
   * Creates a UserPersonalInfo from persistence data
   * @param data - Prisma UserPersonalInfo data
   * @returns UserPersonalInfo instance
   */
  static fromPersistence(data: any): UserPersonalInfo {
    return new UserPersonalInfo(
      data.id,
      UserId.fromString(data.userId),
      data.phone ?? undefined,
      data.locale ?? undefined,
      data.timeZone ?? undefined,
      data.createdAt,
      data.updatedAt
    );
  }

  /**
   * Gets the personal info unique identifier
   * @returns The personal info ID
   */
  getId(): string {
    return this.id;
  }

  /**
   * Gets the associated user ID
   * @returns The user ID value object
   */
  getUserId(): UserId {
    return this.userId;
  }

  /**
   * Gets the user phone number
   * @returns The phone number or undefined
   */
  getPhone(): string | undefined {
    return this.phone;
  }

  /**
   * Gets the user locale
   * @returns The locale or undefined
   */
  getLocale(): string | undefined {
    return this.locale;
  }

  /**
   * Gets the user timezone
   * @returns The timezone or undefined
   */
  getTimeZone(): string | undefined {
    return this.timeZone;
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
   * Updates the phone number
   * @param phone - New phone number
   */
  updatePhone(phone: string | undefined): void {
    this.phone = phone;
    this.updatedAt = new Date();
  }

  /**
   * Updates the locale
   * @param locale - New locale
   */
  updateLocale(locale: string | undefined): void {
    this.locale = locale;
    this.updatedAt = new Date();
  }

  /**
   * Updates the timezone
   * @param timeZone - New timezone
   */
  updateTimeZone(timeZone: string | undefined): void {
    this.timeZone = timeZone;
    this.updatedAt = new Date();
  }

  /**
   * Updates all personal information
   * @param phone - New phone number
   * @param locale - New locale
   * @param timeZone - New timezone
   */
  updatePersonalInfo(
    phone: string | undefined,
    locale: string | undefined,
    timeZone: string | undefined
  ): void {
    this.phone = phone;
    this.locale = locale;
    this.timeZone = timeZone;
    this.updatedAt = new Date();
  }
}
