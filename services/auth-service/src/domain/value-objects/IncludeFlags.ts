/**
 * @fileoverview IncludeFlags - Value object for conditional data inclusion flags
 * @summary Validates and manages include flags for GET /me endpoint
 * @description This value object handles the include parameter for the GetMe endpoint,
 * validating allowed flags and providing convenient accessor methods.
 */

import { StringValueObject } from '@lawprotect/shared-ts';
import { IncludeFlag } from '../enums';

/**
 * Value object for managing include flags in GET /me requests
 * 
 * Valid flags: 'idp', 'profile', 'claims'
 * Format: comma-separated values (e.g., 'idp,profile')
 */
export class IncludeFlags extends StringValueObject {
  private static readonly VALID_FLAGS = Object.values(IncludeFlag);

  constructor(value: string) {
    super(value);
    this.validateIncludeFlags(value);
  }

  /**
   * Validates that all include flags are valid
   * @param value - The include string to validate
   * @throws Error if any flag is invalid
   */
  private validateIncludeFlags(value: string): void {
    if (!value) return; // Empty string is valid (no includes)
    
    const flags = value.split(',').map(f => f.trim());
    
    for (const flag of flags) {
      if (!IncludeFlags.VALID_FLAGS.includes(flag as any)) {
        throw new Error(`Invalid include flag: ${flag}. Valid flags are: ${IncludeFlags.VALID_FLAGS.join(', ')}`);
      }
    }
  }

  /**
   * Check if providers should be included
   * @returns true if 'idp' flag is present
   */
  getProviders(): boolean {
    return this.value.includes(IncludeFlag.IDP);
  }

  /**
   * Check if profile information should be included
   * @returns true if 'profile' flag is present
   */
  getProfile(): boolean {
    return this.value.includes(IncludeFlag.PROFILE);
  }

  /**
   * Check if claims should be included
   * @returns true if 'claims' flag is present
   */
  getClaims(): boolean {
    return this.value.includes(IncludeFlag.CLAIMS);
  }

  /**
   * Get all active flags as an array
   * @returns Array of active include flags
   */
  getActiveFlags(): string[] {
    if (!this.value) return [];
    return this.value.split(',').map(f => f.trim());
  }

  /**
   * Check if any flags are active
   * @returns true if any include flags are set
   */
  hasAnyFlags(): boolean {
    return this.value.length > 0;
  }
}
