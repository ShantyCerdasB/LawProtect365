/**
 * @fileoverview SortOrder enum - Sort order options for queries
 * @summary Enum for ascending and descending sort orders
 * @description Defines the available sort order options for database queries
 * and API sorting parameters.
 */

/**
 * Sort order options for queries
 * 
 * Defines the available sort order options when sorting results
 * in database queries and API endpoints.
 */
export enum SortOrder {
  /**
   * Sort in ascending order (A-Z, 1-9, oldest first)
   */
  ASC = 'ASC',
  
  /**
   * Sort in descending order (Z-A, 9-1, newest first)
   */
  DESC = 'DESC'
}
