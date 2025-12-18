/**
 * @fileoverview CognitoEventMapper Interfaces - Type definitions for event mappers
 * @summary Defines interfaces for Cognito event mapping operations
 * @description
 * Contains TypeScript interfaces for Cognito event mapping functions,
 * ensuring type safety and consistency across mapper implementations.
 */

import type { CognitoEventData } from '../../../domain/value-objects/CognitoEventData';

/**
 * @description Function type for mapping Cognito events to domain objects.
 * @template TEvent - Type of the Cognito trigger event
 * @param {TEvent} event - Cognito trigger event
 * @returns {CognitoEventData} Extracted and transformed event data
 */
export type CognitoEventMapper<TEvent = unknown> = (event: TEvent) => CognitoEventData;

