/**
 * @fileoverview mockSetupHelper - Helper for setting up mocks in integration tests
 * @summary Centralized mock setup utilities
 * @description Provides utilities for setting up mocks in integration tests,
 * using the new OutboxRepository mock instead of SignatureOrchestrator mocks.
 */

import { setupOutboxRepositoryMock, OutboxRepositoryTestHelpers } from '../shared/mocks/OutboxRepositoryMock';

/**
 * Setup mock for basic envelope tests (most common)
 * @description Sets up OutboxRepository mock for basic event publishing
 */
export function setupBasicMock(): void {
  setupOutboxRepositoryMock({ logEvents: true, trackEvents: true });
}

/**
 * Setup mock for reminder tests
 * @description Sets up OutboxRepository mock for reminder event publishing
 */
export function setupReminderMock(): void {
  setupOutboxRepositoryMock({ logEvents: true, trackEvents: true });
}

/**
 * Setup mock for decline tests
 * @description Sets up OutboxRepository mock for decline event publishing
 */
export function setupDeclineMock(): void {
  setupOutboxRepositoryMock({ logEvents: true, trackEvents: true });
}

/**
 * Setup mock for viewer tests
 * @description Sets up OutboxRepository mock for viewer event publishing
 */
export function setupViewerMock(): void {
  setupOutboxRepositoryMock({ logEvents: true, trackEvents: true });
}

/**
 * Setup mock for cancellation tests
 * @description Sets up OutboxRepository mock for cancellation event publishing
 */
export function setupCancellationMock(): void {
  setupOutboxRepositoryMock({ logEvents: true, trackEvents: true });
}

/**
 * Setup mock for cancel envelope tests
 * @description Sets up OutboxRepository mock for cancel envelope event publishing
 */
export function setupCancelEnvelopeMock(): void {
  setupOutboxRepositoryMock({ logEvents: true, trackEvents: true });
}

/**
 * Setup mock for decline signer tests
 * @description Sets up OutboxRepository mock for decline signer event publishing
 */
export function setupDeclineSignerMock(): void {
  setupOutboxRepositoryMock({ logEvents: true, trackEvents: true });
}

/**
 * Setup comprehensive mock for tests that need all mocks
 * @description Sets up OutboxRepository mock with detailed logging
 */
export function setupComprehensiveMock(): void {
  setupOutboxRepositoryMock({ logEvents: true, trackEvents: true });
}

/**
 * Setup custom mock with specific configuration
 * @param config - Custom mock configuration
 */
export function setupCustomMock(config: {
  logEvents?: boolean;
  trackEvents?: boolean;
}): void {
  setupOutboxRepositoryMock(config);
}

/**
 * Export test helpers for verification
 */
export { OutboxRepositoryTestHelpers };
