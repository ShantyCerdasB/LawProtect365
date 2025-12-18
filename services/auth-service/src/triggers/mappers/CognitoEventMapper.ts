/**
 * @fileoverview CognitoEventMapper - Maps Cognito trigger events to domain value objects
 * @summary Transforms Cognito trigger events into standardized domain objects
 * @description
 * Provides mapping functions to extract and transform data from various Cognito
 * trigger events into CognitoEventData value objects. Ensures consistent data
 * extraction across all trigger types.
 */

import { CognitoEventData } from '../../domain/value-objects/CognitoEventData';
import type { PreAuthEvent } from '../../types/cognito/PreAuthEvent';
import type { PostAuthEvent } from '../../types/cognito/PostAuthEvent';
import type { PostConfirmationEvent } from '../../types/cognito/PostConfirmationEvent';
import type { PreTokenGenEvent } from '../../types/cognito/PreTokenGenEvent';

/**
 * @description Maps a PreAuthentication event to CognitoEventData.
 * @param {PreAuthEvent} event - PreAuthentication trigger event
 * @returns {CognitoEventData} Extracted event data
 */
export function mapPreAuthEvent(event: PreAuthEvent): CognitoEventData {
  const userAttributes = event.request.userAttributes;
  
  return new CognitoEventData(
    event.userName,
    userAttributes as Record<string, string>,
    userAttributes.email,
    userAttributes.given_name,
    userAttributes.family_name,
    userAttributes.phone_number,
    undefined,
    event.request.clientMetadata,
    event.requestContext?.awsRequestId
  );
}

/**
 * @description Maps a PostAuthentication event to CognitoEventData.
 * @param {PostAuthEvent} event - PostAuthentication trigger event
 * @returns {CognitoEventData} Extracted event data
 */
export function mapPostAuthEvent(event: PostAuthEvent): CognitoEventData {
  const userAttributes = event.request.userAttributes;
  
  return new CognitoEventData(
    event.userName,
    userAttributes,
    userAttributes.email,
    userAttributes.given_name,
    userAttributes.family_name,
    userAttributes.phone_number,
    userAttributes.locale,
    undefined,
    event.requestContext?.awsRequestId
  );
}

/**
 * @description Maps a PostConfirmation event to CognitoEventData.
 * @param {PostConfirmationEvent} event - PostConfirmation trigger event
 * @returns {CognitoEventData} Extracted event data
 */
export function mapPostConfirmationEvent(event: PostConfirmationEvent): CognitoEventData {
  const userAttributes = event.request.userAttributes;
  
  return new CognitoEventData(
    event.userName,
    userAttributes as Record<string, string>,
    userAttributes.email,
    userAttributes.given_name,
    userAttributes.family_name,
    userAttributes.phone_number,
    userAttributes.locale,
    event.request.clientMetadata,
    event.requestContext?.awsRequestId
  );
}

/**
 * @description Maps a PreTokenGeneration event to CognitoEventData.
 * @param {PreTokenGenEvent} event - PreTokenGeneration trigger event
 * @returns {CognitoEventData} Extracted event data
 */
export function mapPreTokenGenEvent(event: PreTokenGenEvent): CognitoEventData {
  const userAttributes = event.request.userAttributes;
  
  return new CognitoEventData(
    event.userName,
    userAttributes as Record<string, string>,
    userAttributes.email,
    userAttributes.given_name,
    userAttributes.family_name,
    userAttributes.phone_number,
    userAttributes.locale,
    event.request.clientMetadata,
    event.requestContext?.awsRequestId
  );
}

