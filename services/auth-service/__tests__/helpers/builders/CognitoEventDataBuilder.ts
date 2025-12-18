/**
 * @fileoverview CognitoEventDataBuilder - Builder for creating CognitoEventData value objects
 * @summary Provides fluent API for building CognitoEventData in tests
 * @description Reusable builder pattern for creating test CognitoEventData
 */

import { CognitoEventData } from '../../../src/domain/value-objects/CognitoEventData';
import { TestUtils, TEST_CONSTANTS } from '../testUtils';

/**
 * @description Builder for creating CognitoEventData test data
 */
export class CognitoEventDataBuilder {
  private cognitoSub: string = TestUtils.generateCognitoSub();
  private userAttributes: Record<string, string> = {
    sub: this.cognitoSub,
    email: TestUtils.createTestEmail(),
    given_name: 'John',
    family_name: 'Doe'
  };
  private email?: string = TestUtils.createTestEmail();
  private givenName?: string = 'John';
  private familyName?: string = 'Doe';
  private phoneNumber?: string;
  private locale?: string = 'en';
  private clientMetadata?: Record<string, string>;
  private requestId?: string = TEST_CONSTANTS.TEST_REQUEST_ID;

  /**
   * @description Sets the Cognito sub.
   * @param {string} cognitoSub - Cognito user sub
   * @returns {CognitoEventDataBuilder} Builder instance
   */
  withCognitoSub(cognitoSub: string): this {
    this.cognitoSub = cognitoSub;
    this.userAttributes.sub = cognitoSub;
    return this;
  }

  /**
   * @description Sets user attributes.
   * @param {Record<string, string>} attributes - User attributes
   * @returns {CognitoEventDataBuilder} Builder instance
   */
  withUserAttributes(attributes: Record<string, string>): this {
    this.userAttributes = { ...this.userAttributes, ...attributes };
    return this;
  }

  /**
   * @description Sets email.
   * @param {string} email - User email
   * @returns {CognitoEventDataBuilder} Builder instance
   */
  withEmail(email: string): this {
    this.email = email;
    this.userAttributes.email = email;
    return this;
  }

  /**
   * @description Sets given name.
   * @param {string} givenName - User given name
   * @returns {CognitoEventDataBuilder} Builder instance
   */
  withGivenName(givenName: string): this {
    this.givenName = givenName;
    this.userAttributes.given_name = givenName;
    return this;
  }

  /**
   * @description Sets family name.
   * @param {string} familyName - User family name
   * @returns {CognitoEventDataBuilder} Builder instance
   */
  withFamilyName(familyName: string): this {
    this.familyName = familyName;
    this.userAttributes.family_name = familyName;
    return this;
  }

  /**
   * @description Sets phone number.
   * @param {string} phoneNumber - User phone number
   * @returns {CognitoEventDataBuilder} Builder instance
   */
  withPhoneNumber(phoneNumber: string): this {
    this.phoneNumber = phoneNumber;
    this.userAttributes.phone_number = phoneNumber;
    return this;
  }

  /**
   * @description Sets locale.
   * @param {string} locale - User locale
   * @returns {CognitoEventDataBuilder} Builder instance
   */
  withLocale(locale: string): this {
    this.locale = locale;
    this.userAttributes.locale = locale;
    return this;
  }

  /**
   * @description Sets client metadata.
   * @param {Record<string, string>} metadata - Client metadata
   * @returns {CognitoEventDataBuilder} Builder instance
   */
  withClientMetadata(metadata: Record<string, string>): this {
    this.clientMetadata = metadata;
    return this;
  }

  /**
   * @description Sets request ID.
   * @param {string} requestId - AWS request ID
   * @returns {CognitoEventDataBuilder} Builder instance
   */
  withRequestId(requestId: string): this {
    this.requestId = requestId;
    return this;
  }

  /**
   * @description Builds the CognitoEventData.
   * @returns {CognitoEventData} Complete CognitoEventData instance
   */
  build(): CognitoEventData {
    return new CognitoEventData(
      this.cognitoSub,
      this.userAttributes,
      this.email,
      this.givenName,
      this.familyName,
      this.phoneNumber,
      this.locale,
      this.clientMetadata,
      this.requestId
    );
  }
}

