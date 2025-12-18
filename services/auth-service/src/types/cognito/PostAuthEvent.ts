/**
 * @fileoverview PostAuthEvent - Types for Cognito PostAuthentication trigger
 * @summary Type definitions for Cognito PostAuthentication event structure
 * @description Provides type-safe interfaces for Cognito PostAuthentication trigger events,
 * including request/response structures and user attribute mappings.
 */

import type { LambdaTriggerEvent } from '@lawprotect/shared-ts';

/**
 * Cognito PostAuthentication trigger event structure
 */
export type PostAuthEvent = LambdaTriggerEvent & {
  version: string;
  triggerSource: string; // "PostAuthentication_Authentication" etc.
  region: string;
  userPoolId: string;
  userName: string; // Cognito sub
  callerContext?: Record<string, unknown>;
  request: {
    userAttributes: Record<string, string>;
    newDeviceUsed?: boolean;
  };
  response: Record<string, unknown>;
  requestContext?: { awsRequestId?: string };
};

/**
 * PostAuthentication trigger result (echoes back the event)
 */
export type PostAuthResult = PostAuthEvent;

