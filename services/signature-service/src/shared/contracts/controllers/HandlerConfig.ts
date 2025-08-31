/**
 * @file HandlerConfig.ts
 * @summary Handler configuration contract
 * @description Configuration options for handler creation
 */

/**
 * @summary Configuration options for handler creation
 * @description Options to customize the handler behavior
 */
export interface HandlerConfig {
  /** Whether authentication is required */
  auth?: boolean;
}
