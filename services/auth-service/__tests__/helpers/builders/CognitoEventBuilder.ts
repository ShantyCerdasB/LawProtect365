/**
 * @fileoverview CognitoEventBuilder - Builder for creating Cognito trigger events
 * @summary Provides fluent API for building Cognito trigger events in tests
 * @description Reusable builder pattern for creating test Cognito events
 */

import type { PreAuthEvent } from '../../../src/types/cognito/PreAuthEvent';
import type { PostAuthEvent } from '../../../src/types/cognito/PostAuthEvent';
import type { PostConfirmationEvent } from '../../../src/types/cognito/PostConfirmationEvent';
import type { PreTokenGenEvent } from '../../../src/types/cognito/PreTokenGenEvent';
import { TestUtils, TEST_CONSTANTS } from '../testUtils';

/**
 * @description Builder for creating PreAuthEvent test data
 */
export class PreAuthEventBuilder {
  private event: Partial<PreAuthEvent> = {
    userName: TestUtils.generateCognitoSub(),
    requestContext: {
      awsRequestId: TEST_CONSTANTS.TEST_REQUEST_ID
    },
    request: {
      userAttributes: {
        sub: TestUtils.generateCognitoSub(),
        email: TestUtils.createTestEmail(),
        email_verified: 'true',
        given_name: 'John',
        family_name: 'Doe'
      },
      clientMetadata: {},
      validationData: {},
      userAgent: TestUtils.createTestUserAgent(),
      ipAddress: TestUtils.createTestIpAddress()
    },
    response: {}
  };

  /**
   * @description Sets the userName (Cognito sub).
   * @param {string} userName - Cognito user sub
   * @returns {PreAuthEventBuilder} Builder instance
   */
  withUserName(userName: string): this {
    this.event.userName = userName;
    if (this.event.request?.userAttributes) {
      this.event.request.userAttributes.sub = userName;
    }
    return this;
  }

  /**
   * @description Sets user attributes.
   * @param {Record<string, string | undefined>} attributes - User attributes
   * @returns {PreAuthEventBuilder} Builder instance
   */
  withUserAttributes(attributes: Record<string, string | undefined>): this {
    if (!this.event.request) {
      this.event.request = { userAttributes: {} };
    }
    const optionalFields = ['given_name', 'family_name', 'phone_number'];
    const providedKeys = Object.keys(attributes);
    const mergedAttributes: Record<string, string | undefined> = {
      ...this.event.request.userAttributes,
      ...attributes
    };
    optionalFields.forEach(key => {
      if (!providedKeys.includes(key) && mergedAttributes[key] !== undefined) {
        delete mergedAttributes[key];
      }
    });
    const finalAttributes: Record<string, string> = {};
    Object.keys(mergedAttributes).forEach(key => {
      if (mergedAttributes[key] !== undefined) {
        finalAttributes[key] = mergedAttributes[key] as string;
      }
    });
    this.event.request.userAttributes = finalAttributes;
    return this;
  }

  /**
   * @description Sets the request ID.
   * @param {string} requestId - AWS request ID
   * @returns {PreAuthEventBuilder} Builder instance
   */
  withRequestId(requestId: string): this {
    if (!this.event.requestContext) {
      this.event.requestContext = {};
    }
    this.event.requestContext.awsRequestId = requestId;
    return this;
  }

  /**
   * @description Sets MFA requirement.
   * @param {boolean} required - Whether MFA is required
   * @returns {PreAuthEventBuilder} Builder instance
   */
  withMfaRequired(required: boolean): this {
    return this.withUserAttributes({
      'custom:is_mfa_required': required ? 'true' : 'false'
    });
  }

  /**
   * @description Sets user role.
   * @param {string} role - User role
   * @returns {PreAuthEventBuilder} Builder instance
   */
  withRole(role: string): this {
    return this.withUserAttributes({
      'custom:role': role
    });
  }

  /**
   * @description Builds the PreAuthEvent.
   * @returns {PreAuthEvent} Complete PreAuthEvent
   */
  build(): PreAuthEvent {
    return this.event as PreAuthEvent;
  }
}

/**
 * @description Builder for creating PostAuthEvent test data
 */
export class PostAuthEventBuilder {
  private event: Partial<PostAuthEvent> = {
    version: '1',
    triggerSource: 'PostAuthentication_Authentication',
    region: 'us-east-1',
    userPoolId: TEST_CONSTANTS.TEST_USER_POOL_ID,
    userName: TestUtils.generateCognitoSub(),
    requestContext: {
      awsRequestId: TEST_CONSTANTS.TEST_REQUEST_ID
    },
    request: {
      userAttributes: {
        sub: TestUtils.generateCognitoSub(),
        email: TestUtils.createTestEmail(),
        given_name: 'John',
        family_name: 'Doe',
        locale: 'en'
      },
      newDeviceUsed: false
    },
    response: {}
  };

  /**
   * @description Sets the userName (Cognito sub).
   * @param {string} userName - Cognito user sub
   * @returns {PostAuthEventBuilder} Builder instance
   */
  withUserName(userName: string): this {
    this.event.userName = userName;
    if (this.event.request?.userAttributes) {
      this.event.request.userAttributes.sub = userName;
    }
    return this;
  }

  /**
   * @description Sets user attributes.
   * @param {Record<string, string | undefined>} attributes - User attributes
   * @returns {PostAuthEventBuilder} Builder instance
   */
  withUserAttributes(attributes: Record<string, string | undefined>): this {
    if (!this.event.request) {
      this.event.request = { userAttributes: {} };
    }
    const optionalFields = ['given_name', 'family_name', 'phone_number', 'locale'];
    const providedKeys = Object.keys(attributes);
    const mergedAttributes: Record<string, string | undefined> = {
      ...this.event.request.userAttributes,
      ...attributes
    };
    optionalFields.forEach(key => {
      if (!providedKeys.includes(key) && mergedAttributes[key] !== undefined) {
        delete mergedAttributes[key];
      }
    });
    const finalAttributes: Record<string, string> = {};
    Object.keys(mergedAttributes).forEach(key => {
      if (mergedAttributes[key] !== undefined) {
        finalAttributes[key] = mergedAttributes[key] as string;
      }
    });
    this.event.request.userAttributes = finalAttributes;
    return this;
  }

  /**
   * @description Builds the PostAuthEvent.
   * @returns {PostAuthEvent} Complete PostAuthEvent
   */
  build(): PostAuthEvent {
    return this.event as PostAuthEvent;
  }
}

/**
 * @description Builder for creating PostConfirmationEvent test data
 */
export class PostConfirmationEventBuilder {
  private event: Partial<PostConfirmationEvent> = {
    userName: TestUtils.generateCognitoSub(),
    requestContext: {
      awsRequestId: TEST_CONSTANTS.TEST_REQUEST_ID
    },
    request: {
      userAttributes: {
        sub: TestUtils.generateCognitoSub(),
        email: TestUtils.createTestEmail(),
        email_verified: 'true',
        given_name: 'John',
        family_name: 'Doe',
        phone_number: '+1234567890',
        locale: 'en'
      },
      clientMetadata: {}
    },
    response: {}
  };

  /**
   * @description Sets the userName (Cognito sub).
   * @param {string} userName - Cognito user sub
   * @returns {PostConfirmationEventBuilder} Builder instance
   */
  withUserName(userName: string): this {
    this.event.userName = userName;
    if (this.event.request?.userAttributes) {
      this.event.request.userAttributes.sub = userName;
    }
    return this;
  }

  /**
   * @description Sets user attributes.
   * @param {Record<string, string | undefined>} attributes - User attributes
   * @returns {PostConfirmationEventBuilder} Builder instance
   */
  withUserAttributes(attributes: Record<string, string | undefined>): this {
    if (!this.event.request) {
      this.event.request = { userAttributes: {} };
    }
    const optionalFields = ['given_name', 'family_name', 'phone_number', 'locale'];
    const providedKeys = Object.keys(attributes);
    const mergedAttributes: Record<string, string | undefined> = {
      ...this.event.request.userAttributes,
      ...attributes
    };
    optionalFields.forEach(key => {
      if (!providedKeys.includes(key) && mergedAttributes[key] !== undefined) {
        delete mergedAttributes[key];
      }
    });
    const finalAttributes: Record<string, string> = {};
    Object.keys(mergedAttributes).forEach(key => {
      if (mergedAttributes[key] !== undefined) {
        finalAttributes[key] = mergedAttributes[key] as string;
      }
    });
    this.event.request.userAttributes = finalAttributes;
    return this;
  }

  /**
   * @description Builds the PostConfirmationEvent.
   * @returns {PostConfirmationEvent} Complete PostConfirmationEvent
   */
  build(): PostConfirmationEvent {
    return this.event as PostConfirmationEvent;
  }
}

/**
 * @description Builder for creating PreTokenGenEvent test data
 */
export class PreTokenGenEventBuilder {
  private event: Partial<PreTokenGenEvent> = {
    userName: TestUtils.generateCognitoSub(),
    requestContext: {
      awsRequestId: TEST_CONSTANTS.TEST_REQUEST_ID
    },
    request: {
      userAttributes: {
        sub: TestUtils.generateCognitoSub(),
        email: TestUtils.createTestEmail(),
        given_name: 'John',
        family_name: 'Doe',
        locale: 'en'
      },
      clientMetadata: {},
      groupConfiguration: {
        groupsToOverride: [],
        iamRolesToOverride: [],
        preferredRole: undefined
      }
    },
    response: {
      claimsOverrideDetails: {
        claimsToAddOrOverride: {},
        claimsToSuppress: [],
        groupOverrideDetails: {
          groupsToOverride: [],
          iamRolesToOverride: [],
          preferredRole: undefined
        }
      }
    }
  };

  /**
   * @description Sets the userName (Cognito sub).
   * @param {string} userName - Cognito user sub
   * @returns {PreTokenGenEventBuilder} Builder instance
   */
  withUserName(userName: string): this {
    this.event.userName = userName;
    if (this.event.request?.userAttributes) {
      this.event.request.userAttributes.sub = userName;
    }
    return this;
  }

  /**
   * @description Sets user attributes.
   * @param {Record<string, string | undefined>} attributes - User attributes
   * @returns {PreTokenGenEventBuilder} Builder instance
   */
  withUserAttributes(attributes: Record<string, string | undefined>): this {
    if (!this.event.request) {
      this.event.request = { userAttributes: {} };
    }
    const optionalFields = ['given_name', 'family_name', 'phone_number', 'locale'];
    const providedKeys = Object.keys(attributes);
    const mergedAttributes: Record<string, string | undefined> = {
      ...this.event.request.userAttributes,
      ...attributes
    };
    optionalFields.forEach(key => {
      if (!providedKeys.includes(key) && mergedAttributes[key] !== undefined) {
        delete mergedAttributes[key];
      }
    });
    const finalAttributes: Record<string, string> = {};
    Object.keys(mergedAttributes).forEach(key => {
      if (mergedAttributes[key] !== undefined) {
        finalAttributes[key] = mergedAttributes[key] as string;
      }
    });
    this.event.request.userAttributes = finalAttributes;
    return this;
  }

  /**
   * @description Builds the PreTokenGenEvent.
   * @returns {PreTokenGenEvent} Complete PreTokenGenEvent
   */
  build(): PreTokenGenEvent {
    return this.event as PreTokenGenEvent;
  }
}

