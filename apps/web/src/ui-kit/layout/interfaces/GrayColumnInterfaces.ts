/**
 * @fileoverview Gray Column Interfaces - Type definitions for GrayColumn component
 * @summary Defines interfaces for GrayColumn component
 * @description
 * Type definitions for the GrayColumn component including props configuration.
 */

/**
 * @description Props for the GrayColumn component
 */
export interface GrayColumnProps {
  /** Width classes for the column (default: 'w-1/5 md:w-[20%]') */
  width?: string;
  /** Background color class (default: 'bg-gray-100') */
  backgroundColor?: string;
  /** Additional CSS classes */
  className?: string;
}

