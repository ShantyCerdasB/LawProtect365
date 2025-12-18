/**
 * @fileoverview PreAuthEvent - Cognito PreAuthentication trigger event types
 * @summary Type definitions for Cognito PreAuthentication trigger
 * @description Defines the structure of Cognito PreAuthentication trigger events
 * and responses, providing type safety for authentication validation.
 */

/**
 * Cognito PreAuthentication trigger event structure
 * 
 * This event is triggered before user authentication to validate
 * user access and MFA requirements.
 */
import type { LambdaTriggerEvent } from '@lawprotect/shared-ts';

export interface PreAuthEvent extends LambdaTriggerEvent {
  /** Cognito user sub (unique identifier) */
  userName: string;
  
  /** Request context with AWS request ID */
  requestContext?: {
    awsRequestId?: string;
  };
  
  /** User attributes from Cognito */
  request: {
    userAttributes: {
      sub?: string;
      email?: string;
      email_verified?: string;
      phone_number?: string;
      phone_number_verified?: string;
      given_name?: string;
      family_name?: string;
      'custom:role'?: string;
      'custom:is_mfa_required'?: string;
      [key: string]: string | undefined;
    };
    
    /** Client metadata (optional) */
    clientMetadata?: Record<string, string>;
    
    /** Validation data (optional) */
    validationData?: Record<string, string>;
    
    /** User agent information */
    userAgent?: string;
    
    /** IP address */
    ipAddress?: string;
  };
  
  /** Response object (initially empty, populated by trigger) */
  response: {
    /** Challenge name if MFA is required */
    challengeName?: string;
    
    /** Challenge parameters */
    challengeParameters?: Record<string, string>;
    
    /** Issue tokens flag */
    issueTokens?: boolean;
    
    /** Fail authentication flag */
    failAuthentication?: boolean;
  };
}

/**
 * Cognito PreAuthentication trigger result
 * 
 * The result is the same event structure, potentially modified
 * by the trigger to add challenge information or deny access.
 */
export type PreAuthResult = PreAuthEvent;
