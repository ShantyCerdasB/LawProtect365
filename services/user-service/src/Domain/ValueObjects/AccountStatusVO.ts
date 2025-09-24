/**
 * @fileoverview AccountStatusVO - Account status value object
 * @summary Enum-based account status with validation
 * @description Represents a user's account status in the system.
 */

import { ValueObject } from "@lawprotect/shared-ts";
import { UserAccountStatus } from "@prisma/client";
import { validationFailed } from "../../UserServiceErrors";

/**
 * Account status value object
 * 
 * Represents a user's account status in the system with predefined values.
 * Provides status checking methods and validation.
 * 
 * @example
 * ```ts
 * const status = AccountStatusVO.fromString("ACTIVE");
 * console.log(status.isActive()); // true
 * ```
 */
export class AccountStatusVO extends ValueObject<UserAccountStatus> {
  private static readonly VALID_STATUSES: readonly UserAccountStatus[] = Object.values(UserAccountStatus);

  /**
   * Creates a new AccountStatusVO from a string value
   * @param value - The status string to validate
   * @returns A new AccountStatusVO instance
   * @throws validationFailed when the value is not a valid status
   */
  static fromString(value: string): AccountStatusVO {
    AccountStatusVO.validate(value);
    return new AccountStatusVO(value as UserAccountStatus);
  }

  /**
   * Validates that the value is a valid account status
   * @param value - The status string to validate
   * @throws validationFailed when validation fails
   */
  private static validate(value: string): void {
    if (!value) {
      throw validationFailed("Account status cannot be empty", { value });
    }

    if (!AccountStatusVO.VALID_STATUSES.includes(value as UserAccountStatus)) {
      throw validationFailed(
        `Invalid account status. Must be one of: ${AccountStatusVO.VALID_STATUSES.join(", ")}`,
        { 
          value, 
          validStatuses: AccountStatusVO.VALID_STATUSES 
        }
      );
    }
  }

  /**
   * Private constructor - use static factory methods instead
   * @param value - The validated status value
   */
  private constructor(value: UserAccountStatus) {
    super(value);
  }

  /**
   * Checks if this AccountStatusVO equals another AccountStatusVO
   * @param other - The other AccountStatusVO to compare with
   * @returns True if both AccountStatusVOs have the same value
   */
  equals(other: AccountStatusVO | undefined | null): boolean {
    if (!other) return false;
    return this.value === other.value;
  }

  /**
   * Returns the string representation of the status
   * @returns The status string
   */
  toString(): string {
    return this.value;
  }

  /**
   * Returns the JSON representation of the status
   * @returns The status string
   */
  toJSON(): UserAccountStatus {
    return this.value;
  }

  /**
   * Checks if the account is active
   * @returns True if the status is active
   */
  isActive(): boolean {
    return this.value === UserAccountStatus.ACTIVE;
  }

  /**
   * Checks if the account is inactive
   * @returns True if the status is inactive
   */
  isInactive(): boolean {
    return this.value === UserAccountStatus.INACTIVE;
  }

  /**
   * Checks if the account is suspended
   * @returns True if the status is suspended
   */
  isSuspended(): boolean {
    return this.value === UserAccountStatus.SUSPENDED;
  }

  /**
   * Checks if the account is deleted
   * @returns True if the status is deleted
   */
  isDeleted(): boolean {
    return this.value === UserAccountStatus.DELETED;
  }

  /**
   * Checks if the account can be used (active status)
   * @returns True if the account can be used
   */
  canBeUsed(): boolean {
    return this.isActive();
  }

  /**
   * Checks if the account is in a terminal state (deleted)
   * @returns True if the account is in a terminal state
   */
  isTerminal(): boolean {
    return this.isDeleted();
  }
}
