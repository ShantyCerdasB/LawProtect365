/**
 * @fileoverview Gray Separator Interfaces - Type definitions for GraySeparator component
 * @summary Defines interfaces for GraySeparator component
 * @description
 * Type definitions for the GraySeparator component including props configuration.
 */

/**
 * @description Props for the GraySeparator component
 */
export interface GraySeparatorProps {
  /** Height classes for the separator (default: 'h-4 md:h-6') */
  height?: string;
  /** Background color class (default: 'bg-gray-100') */
  backgroundColor?: string;
  /** Additional CSS classes */
  className?: string;
}

