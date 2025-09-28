/**
 * @fileoverview ResponseType Enum - HTTP response types for controllers
 * @summary Enum for standard HTTP response types used in ControllerFactory
 * @description Defines the standard response types that can be used with
 * ControllerFactory for consistent HTTP response handling across microservices.
 */

/**
 * Standard HTTP response types for ControllerFactory
 * @description These types correspond to standard HTTP status codes and response patterns
 */
export enum ResponseType {
  /** 200 OK - Standard successful response */
  OK = 'ok',
  /** 201 Created - Resource creation successful */
  CREATED = 'created',
  /** 204 No Content - Successful operation with no response body */
  NO_CONTENT = 'noContent'
}
