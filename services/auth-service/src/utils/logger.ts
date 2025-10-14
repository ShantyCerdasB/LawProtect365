/**
 * @fileoverview Logger utilities for auth service
 * @summary Centralized logging configuration and utilities
 * @description Provides structured logging utilities for the auth service,
 * including component-specific loggers and consistent formatting.
 */

import { createLogger, Logger } from '@lawprotect/shared-ts';

/**
 * Creates a service logger with default configuration
 * @param component - Optional component name for context
 * @returns Configured logger instance
 */
export const createServiceLogger = (component?: string): Logger => {
  return createLogger({
    service: 'auth-service',
    component: component || 'auth-service',
    environment: process.env.NODE_ENV || 'development',
    version: process.env.SERVICE_VERSION || '1.0.0'
  });
};

/**
 * Default service logger instance
 */
export const logger = createServiceLogger();

/**
 * Creates a component-specific logger
 * @param component - Component name (e.g., 'PostConfirmationOrchestrator')
 * @returns Logger instance with component context
 */
export const createComponentLogger = (component: string): Logger => {
  return createServiceLogger(component);
};
