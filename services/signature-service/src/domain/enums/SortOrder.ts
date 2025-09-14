/**
 * @fileoverview SortOrder enum - Defines sorting order options
 * @summary Enumerates the available sorting order options for queries
 * @description The SortOrder enum defines the direction of sorting
 * for various query operations across the application.
 */

/**
 * Sort order enumeration
 * 
 * Defines the direction of sorting for query operations.
 * Used consistently across all sortable endpoints.
 */
export enum SortOrder {
  /**
   * Ascending order - A to Z, 1 to 9, oldest to newest
   * - Default for most alphabetical and chronological sorts
   */
  ASC = 'asc',

  /**
   * Descending order - Z to A, 9 to 1, newest to oldest
   * - Default for most timestamp and priority sorts
   */
  DESC = 'desc'
}

/**
 * Gets the display name for a sort order
 */
export function getSortOrderDisplayName(order: SortOrder): string {
  switch (order) {
    case SortOrder.ASC:
      return 'Ascending';
    case SortOrder.DESC:
      return 'Descending';
    default:
      return 'Unknown';
  }
}
