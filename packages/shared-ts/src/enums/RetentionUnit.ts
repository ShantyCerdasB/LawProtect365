/**
 * @fileoverview RetentionUnit enum - Defines retention time units
 * @summary Enumerates retention time units for compliance and business rules
 * @description The RetentionUnit enum defines all possible time units
 * that can be used for retention policies in the signature service.
 */

/**
 * Retention time unit enumeration
 * 
 * Defines all possible time units for retention policies.
 * Used for compliance and business rule validation.
 */
export enum RetentionUnit {
  /**
   * Days - Retention period in days
   * - Used for short-term retention policies
   * - Common for temporary document storage
   */
  DAYS = 'DAYS',

  /**
   * Months - Retention period in months
   * - Used for medium-term retention policies
   * - Common for business document storage
   */
  MONTHS = 'MONTHS',

  /**
   * Years - Retention period in years
   * - Used for long-term retention policies
   * - Common for legal and compliance document storage
   */
  YEARS = 'YEARS'
}

/**
 * Converts retention unit to milliseconds
 * @param unit - The retention unit
 * @param period - The retention period
 * @returns The retention period in milliseconds
 */
export function retentionUnitToMs(unit: RetentionUnit, period: number): number {
  switch (unit) {
    case RetentionUnit.DAYS:
      return period * 24 * 60 * 60 * 1000;
    case RetentionUnit.MONTHS:
      return period * 30 * 24 * 60 * 60 * 1000; // Approximate
    case RetentionUnit.YEARS:
      return period * 365 * 24 * 60 * 60 * 1000; // Approximate
    default:
      throw new Error(`Invalid retention unit: ${unit}`);
  }
}
