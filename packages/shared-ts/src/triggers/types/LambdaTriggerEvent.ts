/**
 * @fileoverview LambdaTriggerEvent - Common interface for Lambda trigger events
 * @summary Defines the base structure for all Lambda trigger events
 * @description This interface provides common properties that all Lambda triggers share
 */

/**
 * Base interface for all Lambda trigger events
 */
export interface LambdaTriggerEvent {
  /** AWS request context containing request ID and other metadata */
  requestContext?: { 
    awsRequestId?: string;
    [key: string]: any;
  };
  /** Additional event properties */
  [key: string]: any;
}
