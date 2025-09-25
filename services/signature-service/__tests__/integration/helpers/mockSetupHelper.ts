/**
 * @fileoverview mockSetupHelper - Helper for setting up mocks in integration tests
 * @summary Centralized mock setup utilities
 * @description Provides utilities for setting up SignatureOrchestrator mocks
 * in integration tests, eliminating the massive code duplication.
 */

import { setupSignatureOrchestratorMock, MockConfigs } from '../shared/mocks/SignatureOrchestratorMock';

/**
 * Setup mock for basic envelope tests (most common)
 * @description Sets up mock for publishNotificationEvent only
 */
export function setupBasicMock(): void {
  setupSignatureOrchestratorMock(MockConfigs.BASIC);
}

/**
 * Setup mock for reminder tests
 * @description Sets up mocks for publishNotificationEvent and publishReminderNotificationEvent
 */
export function setupReminderMock(): void {
  setupSignatureOrchestratorMock(MockConfigs.REMINDERS);
}

/**
 * Setup mock for decline tests
 * @description Sets up mocks for publishNotificationEvent and publishDeclineNotificationEvent
 */
export function setupDeclineMock(): void {
  setupSignatureOrchestratorMock(MockConfigs.DECLINES);
}

/**
 * Setup mock for viewer tests
 * @description Sets up mocks for publishNotificationEvent and publishViewerNotificationEvent
 */
export function setupViewerMock(): void {
  setupSignatureOrchestratorMock(MockConfigs.VIEWERS);
}

/**
 * Setup mock for cancellation tests
 * @description Sets up mocks for publishNotificationEvent and publishCancellationNotificationEvent
 */
export function setupCancellationMock(): void {
  setupSignatureOrchestratorMock(MockConfigs.CANCELLATIONS);
}

/**
 * Setup comprehensive mock for tests that need all mocks
 * @description Sets up all available mocks with detailed logging
 */
export function setupComprehensiveMock(): void {
  setupSignatureOrchestratorMock(MockConfigs.COMPREHENSIVE);
}

/**
 * Setup custom mock with specific configuration
 * @param config - Custom mock configuration
 */
export function setupCustomMock(config: {
  mockPublishNotificationEvent?: boolean;
  mockPublishReminderNotificationEvent?: boolean;
  mockPublishDeclineNotificationEvent?: boolean;
  mockPublishViewerNotificationEvent?: boolean;
  mockPublishCancellationNotificationEvent?: boolean;
  logLevel?: 'none' | 'basic' | 'detailed';
}): void {
  setupSignatureOrchestratorMock(config);
}
