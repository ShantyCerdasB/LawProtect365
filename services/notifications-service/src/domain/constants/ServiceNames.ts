/**
 * @fileoverview ServiceNames - Service name constants for template and routing
 * @summary Centralized service name constants to avoid hardcoded strings
 * @description Provides service name constants used for template lookup and
 * event routing, ensuring consistency across the notification service.
 */

import { EventSource } from '../enums';

/**
 * Service name mappings from EventBridge sources
 */
export const SERVICE_NAMES = {
  [EventSource.SIGNATURE_SERVICE]: 'signature-service',
  [EventSource.AUTH_SERVICE]: 'auth-service'
} as const;

/**
 * Gets service name from EventBridge source
 * @param {string} source - EventBridge source
 * @returns {string} Service name
 */
export function getServiceNameFromSource(source: string): string {
  return SERVICE_NAMES[source as EventSource] || 'signature-service';
}

