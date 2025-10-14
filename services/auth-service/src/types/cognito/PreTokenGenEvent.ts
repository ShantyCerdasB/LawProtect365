/**
 * @fileoverview PreTokenGenEvent - Types for Cognito PreTokenGeneration trigger
 * @summary Defines the structure for PreTokenGeneration trigger events
 * @description This file contains the TypeScript interfaces for the Cognito
 * PreTokenGeneration trigger event and response structures.
 */

import { PreTokenGenerationTriggerEvent } from 'aws-lambda';

/**
 * PreTokenGeneration trigger event structure
 */
export interface PreTokenGenEvent {
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
    groupConfiguration?: {
      groupsToOverride?: string[];
      iamRolesToOverride?: string[];
      preferredRole?: string;
    };
  };
  response: {
    claimsOverrideDetails?: {
      claimsToAddOrOverride?: {
        [key: string]: string | number | boolean;
      };
      claimsToSuppress?: string[];
      groupOverrideDetails?: {
        groupsToOverride?: string[];
        iamRolesToOverride?: string[];
        preferredRole?: string;
      };
    };
  };
}

/**
 * PreTokenGeneration result (echoes back the event)
 */
export type PreTokenGenResult = PreTokenGenEvent;
