/**
 * @fileoverview CognitoEventData - Value object for extracted Cognito event data
 * @summary Immutable value object representing data extracted from Cognito trigger events
 * @description
 * Provides a type-safe, immutable representation of user data extracted from
 * Cognito trigger events. Used to pass standardized data between triggers, mappers,
 * and orchestrators.
 */

/**
 * @description Immutable value object containing extracted data from Cognito trigger events.
 * @property {string} cognitoSub - Cognito user sub (unique identifier)
 * @property {string} [email] - User email address
 * @property {string} [givenName] - User's given name
 * @property {string} [familyName] - User's family name
 * @property {string} [phoneNumber] - User's phone number
 * @property {string} [locale] - User's locale preference
 * @property {Record<string, string>} userAttributes - All user attributes from Cognito
 * @property {Record<string, string>} [clientMetadata] - Optional client metadata
 * @property {string} [requestId] - AWS request ID for tracing
 */
export class CognitoEventData {
  constructor(
    public readonly cognitoSub: string,
    public readonly userAttributes: Record<string, string>,
    public readonly email?: string,
    public readonly givenName?: string,
    public readonly familyName?: string,
    public readonly phoneNumber?: string,
    public readonly locale?: string,
    public readonly clientMetadata?: Record<string, string>,
    public readonly requestId?: string
  ) {
    if (!cognitoSub || cognitoSub.trim().length === 0) {
      throw new Error('Cognito sub is required');
    }
  }

  /**
   * @description Creates a new instance with optional updated fields.
   * @param {Partial<CognitoEventData>} updates - Fields to update
   * @returns {CognitoEventData} New instance with updated values
   */
  with(updates: Partial<CognitoEventData>): CognitoEventData {
    return new CognitoEventData(
      updates.cognitoSub ?? this.cognitoSub,
      updates.userAttributes ?? this.userAttributes,
      updates.email ?? this.email,
      updates.givenName ?? this.givenName,
      updates.familyName ?? this.familyName,
      updates.phoneNumber ?? this.phoneNumber,
      updates.locale ?? this.locale,
      updates.clientMetadata ?? this.clientMetadata,
      updates.requestId ?? this.requestId
    );
  }
}

