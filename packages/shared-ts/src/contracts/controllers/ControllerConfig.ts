/**
 * @file ControllerConfig.ts
 * @summary Generic controller configuration contracts
 * @description Defines interfaces for generic controller factory configuration using shared-ts
 */

import type { 
  BeforeMiddleware,
  AfterMiddleware 
} from "../../http/middleware.js";

/**
 * @summary Configuration for query controllers (GET operations)
 * @description Configuration for read-only operations using shared-ts middleware system
 */
export interface QueryControllerConfig<TInput = any, TOutput = any> {
  /** Path schema for validation */
  pathSchema?: any;
  /** Query schema for validation (optional) */
  querySchema?: any;
  
  /** App service class to instantiate */
  appServiceClass: new (dependencies: any) => any;
  /** Function to create dependencies from container */
  createDependencies: (container: any) => any;
  /** Function to get container instance */
  getContainer: () => any;
  
  /** Function to extract parameters from validated request */
  extractParams: (path?: any, query?: any, context?: any) => TInput;
  /** Function to transform result for response (optional) */
  transformResult?: (result: any) => TOutput;
  /** Type of HTTP response */
  responseType: "ok" | "created" | "noContent" | "json" | "text" | "binary" | "stream";
  
  /** Additional "before" middlewares to run prior to the handler */
  before?: BeforeMiddleware[];
  /** Additional "after" middlewares to run after the handler */
  after?: AfterMiddleware[];
}

/**
 * @summary Configuration for command controllers (POST/PUT/PATCH/DELETE operations)
 * @description Configuration for write operations using shared-ts middleware system
 */
export interface CommandControllerConfig<TInput = any, TOutput = any> {
  /** Path schema for validation */
  pathSchema?: any;
  /** Body schema for validation (optional) */
  bodySchema?: any;
  
  /** App service class to instantiate */
  appServiceClass: new (dependencies: any) => any;
  /** Function to create dependencies from container */
  createDependencies: (container: any) => any;
  /** Function to get container instance */
  getContainer: () => any;
  
  /** Function to extract parameters from validated request */
  extractParams: (path?: any, body?: any, context?: any) => TInput;
  /** Function to transform result for response (optional) */
  transformResult?: (result: any) => TOutput;
  /** Type of HTTP response */
  responseType: "ok" | "created" | "noContent" | "json" | "text" | "binary" | "stream";
  /** Whether to include actor context */
  includeActor?: boolean;
  /** Method name to call on the service (defaults to 'execute') */
  methodName?: string;
  
  /** Additional "before" middlewares to run prior to the handler */
  before?: BeforeMiddleware[];
  /** Additional "after" middlewares to run after the handler */
  after?: AfterMiddleware[];
}
