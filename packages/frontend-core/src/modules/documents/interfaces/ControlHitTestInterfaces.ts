/**
 * @fileoverview Control Hit Test Interfaces - Input/output types for control hit-testing
 * @summary Type definitions for interactive control detection
 * @description Defines interfaces used by control hit-testing use cases.
 */

/**
 * @description Configuration for control hit-testing.
 */
export interface ControlHitTestConfig {
  /** Size of resize handles in display pixels */
  handleSize: number;
  /** Size of delete button in display pixels */
  deleteSize: number;
}

/**
 * @description Default configuration for control hit-testing.
 */
export const DEFAULT_CONTROL_HIT_TEST_CONFIG: ControlHitTestConfig = {
  handleSize: 12,
  deleteSize: 16,
};

