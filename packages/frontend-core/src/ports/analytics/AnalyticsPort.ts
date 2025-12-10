/**
 * @fileoverview Analytics Port - Interface for analytics tracking
 * @summary Platform-agnostic analytics abstraction
 * @description Defines a contract for analytics tracking across web and mobile platforms,
 * allowing different implementations (Google Analytics, Mixpanel, Segment, Firebase Analytics).
 */

/**
 * @description Interface for analytics tracking operations.
 * Implementations should use platform-specific analytics SDKs.
 */
export interface AnalyticsPort {
  /**
   * @description Tracks an event with optional properties.
   * @param event Event name (e.g., 'button_clicked', 'purchase_completed')
   * @param properties Optional event properties (e.g., { buttonId: 'signup', page: 'home' })
   */
  track(event: string, properties?: Record<string, unknown>): void;

  /**
   * @description Identifies a user with optional traits.
   * @param userId Unique user identifier
   * @param traits Optional user traits (e.g., { email: 'user@example.com', name: 'John' })
   */
  identify(userId: string, traits?: Record<string, unknown>): void;

  /**
   * @description Tracks a screen view.
   * @param name Screen name (e.g., 'Home', 'Profile', 'Settings')
   * @param properties Optional screen properties
   */
  screen(name: string, properties?: Record<string, unknown>): void;
}

