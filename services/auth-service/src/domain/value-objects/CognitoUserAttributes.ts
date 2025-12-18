/**
 * @fileoverview CognitoUserAttributes - Value object for Cognito user attributes
 * @summary Immutable value object representing user attributes from Cognito
 * @description
 * Provides a type-safe representation of user attributes extracted from Cognito
 * events, with validation and helper methods for common attribute access patterns.
 */

/**
 * @description Immutable value object for Cognito user attributes.
 * @property {string} [email] - User email address
 * @property {string} [emailVerified] - Email verification status
 * @property {string} [phoneNumber] - User phone number
 * @property {string} [phoneNumberVerified] - Phone verification status
 * @property {string} [givenName] - User's given name
 * @property {string} [familyName] - User's family name
 * @property {string} [name] - User's full name
 * @property {string} [locale] - User's locale preference
 * @property {string} [role] - User's role from custom attributes
 * @property {string} [isMfaRequired] - MFA requirement from custom attributes
 * @property {Record<string, string>} raw - Raw attributes map
 */
export class CognitoUserAttributes {
  constructor(
    public readonly raw: Record<string, string | undefined>
  ) {}

  /**
   * @description Gets the email address from attributes.
   * @returns {string | undefined} Email address if present
   */
  get email(): string | undefined {
    return this.raw.email;
  }

  /**
   * @description Gets the email verification status.
   * @returns {boolean} True if email is verified
   */
  get emailVerified(): boolean {
    return this.raw.email_verified === 'true';
  }

  /**
   * @description Gets the phone number from attributes.
   * @returns {string | undefined} Phone number if present
   */
  get phoneNumber(): string | undefined {
    return this.raw.phone_number;
  }

  /**
   * @description Gets the phone verification status.
   * @returns {boolean} True if phone is verified
   */
  get phoneNumberVerified(): boolean {
    return this.raw.phone_number_verified === 'true';
  }

  /**
   * @description Gets the given name from attributes.
   * @returns {string | undefined} Given name if present
   */
  get givenName(): string | undefined {
    return this.raw.given_name;
  }

  /**
   * @description Gets the family name from attributes.
   * @returns {string | undefined} Family name if present
   */
  get familyName(): string | undefined {
    return this.raw.family_name;
  }

  /**
   * @description Gets the full name from attributes.
   * @returns {string | undefined} Full name if present
   */
  get name(): string | undefined {
    return this.raw.name;
  }

  /**
   * @description Gets the locale from attributes.
   * @returns {string | undefined} Locale if present
   */
  get locale(): string | undefined {
    return this.raw.locale;
  }

  /**
   * @description Gets the role from custom attributes.
   * @returns {string | undefined} Role if present
   */
  get role(): string | undefined {
    return this.raw['custom:role'];
  }

  /**
   * @description Gets the MFA requirement from custom attributes.
   * @returns {boolean} True if MFA is required
   */
  get isMfaRequired(): boolean {
    return this.raw['custom:is_mfa_required'] === 'true';
  }

  /**
   * @description Gets a custom attribute value.
   * @param {string} key - Attribute key
   * @returns {string | undefined} Attribute value if present
   */
  getCustomAttribute(key: string): string | undefined {
    return this.raw[`custom:${key}`];
  }
}

