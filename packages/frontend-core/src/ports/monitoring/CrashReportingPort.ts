/**
 * @fileoverview Crash Reporting Port - Interface for error tracking and crash reporting
 * @summary Platform-agnostic crash reporting abstraction
 * @description Defines a contract for error tracking and crash reporting across
 * web (Sentry, Bugsnag) and mobile (Sentry, Crashlytics) platforms.
 */

/**
 * @description Interface for crash reporting and error tracking operations.
 * Implementations should use platform-specific error tracking SDKs.
 */
export interface CrashReportingPort {
  /**
   * @description Captures an exception with optional context.
   * @param error Error object to capture
   * @param context Optional context data (e.g., { userId: '123', action: 'login' })
   */
  captureException(error: Error, context?: Record<string, unknown>): void;

  /**
   * @description Sets the current user for error tracking.
   * @param userId Unique user identifier
   * @param email Optional user email
   */
  setUser(userId: string, email?: string): void;

  /**
   * @description Adds a breadcrumb for debugging context.
   * @param message Breadcrumb message
   * @param category Optional breadcrumb category (e.g., 'navigation', 'user', 'http')
   */
  addBreadcrumb(message: string, category?: string): void;
}

