/**
 * @file EventBridgeConstants.ts
 * @summary Re-exports EventBridge constants from domain enums
 * @description This file re-exports EventBridge constants from the centralized domain enums
 * @deprecated Use imports from '../../../domain/values/enums' directly
 */

// Re-export from domain enums to maintain backward compatibility
export {
  EVENT_PATTERNS,
  EVENT_SOURCES,
  DEFAULT_RETRY_CONFIG,
  DEFAULT_BATCH_CONFIG,
} from "../../../domain/values/enums";
