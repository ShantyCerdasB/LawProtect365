/**
 * @file validRoles.ts
 * @summary Valid Cognito roles for the platform
 * @description Centralized definition of valid Cognito roles to avoid duplication
 */

/**
 * Valid Cognito roles for the platform
 * These roles are used across all microservices for authorization
 */
export const VALID_COGNITO_ROLES = [
  "customer",
  "lawyer", 
  "admin",
  "super_admin"
] as const;

/**
 * Type for valid Cognito roles
 */
export type ValidCognitoRole = typeof VALID_COGNITO_ROLES[number];

/**
 * Check if a role is a valid Cognito role
 * @param role Role to check
 * @returns true if role is valid
 */
export const isValidCognitoRole = (role: string): role is ValidCognitoRole => {
  return VALID_COGNITO_ROLES.includes(role as ValidCognitoRole);
};
