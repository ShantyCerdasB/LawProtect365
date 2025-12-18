/**
 * @fileoverview PostConfirmationEvent - Types for Cognito PostConfirmation trigger
 * @summary Defines the structure for PostConfirmation trigger events
 * @description This file contains the TypeScript interfaces for the Cognito
 * PostConfirmation trigger event and response structures.
 */

import type { LambdaTriggerEvent } from '@lawprotect/shared-ts';

/**
 * PostConfirmation trigger event structure
 */
export interface PostConfirmationEvent extends LambdaTriggerEvent {
  userName: string;
  requestContext?: {
    awsRequestId?: string;
  };
  request: {
    userAttributes: {
      [key: string]: string | undefined;
    };
    clientMetadata?: {
      [key: string]: string;
    };
  };
  response: {};
}

/**
 * PostConfirmation result (echoes back the event)
 */
export type PostConfirmationResult = PostConfirmationEvent;
