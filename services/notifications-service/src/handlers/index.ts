/**
 * @fileoverview Handlers - Barrel export for all handlers
 * @summary Exports all handler functions for the notifications-service
 * @description Central export point for all Lambda handlers in the notifications-service
 */

export { EventBridgeHandler, handler, type EventBridgeHandlerResult } from './EventBridgeHandler';
export type { EventBridgeEvent } from '../domain/types/events';
