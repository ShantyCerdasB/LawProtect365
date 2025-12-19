/**
 * @fileoverview Logger Tests - Tests for logger utilities
 * @summary Tests logger creation functions
 * @description Tests the logger utility functions including service logger
 * and component logger creation.
 */

import { describe, it, expect } from '@jest/globals';
import { createServiceLogger, createComponentLogger } from '../../../src/utils/logger';

describe('logger utilities', () => {
  describe('createServiceLogger', () => {
    it('creates service logger with default component', () => {
      const logger = createServiceLogger();
      expect(logger).toBeDefined();
    });

    it('creates service logger with custom component', () => {
      const logger = createServiceLogger('TestComponent');
      expect(logger).toBeDefined();
    });
  });

  describe('createComponentLogger', () => {
    it('creates component logger', () => {
      const logger = createComponentLogger('TestComponent');
      expect(logger).toBeDefined();
    });

    it('creates component logger with different component name', () => {
      const logger = createComponentLogger('AnotherComponent');
      expect(logger).toBeDefined();
    });
  });
});

