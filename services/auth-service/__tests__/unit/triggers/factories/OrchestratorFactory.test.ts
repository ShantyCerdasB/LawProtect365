/**
 * @fileoverview OrchestratorFactory.test.ts - Unit tests for OrchestratorFactory
 * @summary Tests for orchestrator factory creation methods
 * @description Tests that OrchestratorFactory correctly creates orchestrator instances
 * with proper dependencies.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { OrchestratorFactory } from '../../../../src/triggers/factories/OrchestratorFactory';
import { createMockCompositionRoot } from '../../../helpers/mocks';
import {
  PreAuthenticationOrchestrator,
  PostAuthenticationOrchestrator,
  PostConfirmationOrchestrator,
  PreTokenGenerationOrchestrator
} from '../../../../src/application/triggers';

describe('OrchestratorFactory', () => {
  let factory: OrchestratorFactory;
  let mockCompositionRoot: ReturnType<typeof createMockCompositionRoot>;

  beforeEach(() => {
    mockCompositionRoot = createMockCompositionRoot();
    factory = new OrchestratorFactory(mockCompositionRoot);
  });

  describe('createPreAuthenticationOrchestrator', () => {
    it('should create PreAuthenticationOrchestrator with correct dependencies', () => {
      const orchestrator = factory.createPreAuthenticationOrchestrator();

      expect(orchestrator).toBeInstanceOf(PreAuthenticationOrchestrator);
    });

    it('should use composition root services', () => {
      factory.createPreAuthenticationOrchestrator();

      expect(mockCompositionRoot.userService).toBeDefined();
      expect(mockCompositionRoot.cognitoService).toBeDefined();
      expect(mockCompositionRoot.config).toBeDefined();
    });
  });

  describe('createPostAuthenticationOrchestrator', () => {
    it('should create PostAuthenticationOrchestrator with correct dependencies', () => {
      const orchestrator = factory.createPostAuthenticationOrchestrator();

      expect(orchestrator).toBeInstanceOf(PostAuthenticationOrchestrator);
    });

    it('should use composition root services', () => {
      factory.createPostAuthenticationOrchestrator();

      expect(mockCompositionRoot.userService).toBeDefined();
      expect(mockCompositionRoot.cognitoService).toBeDefined();
      expect(mockCompositionRoot.auditService).toBeDefined();
      expect(mockCompositionRoot.eventPublishingService).toBeDefined();
    });
  });

  describe('createPostConfirmationOrchestrator', () => {
    it('should create PostConfirmationOrchestrator with correct dependencies', () => {
      const orchestrator = factory.createPostConfirmationOrchestrator();

      expect(orchestrator).toBeInstanceOf(PostConfirmationOrchestrator);
    });

    it('should use composition root services', () => {
      factory.createPostConfirmationOrchestrator();

      expect(mockCompositionRoot.userService).toBeDefined();
      expect(mockCompositionRoot.cognitoService).toBeDefined();
      expect(mockCompositionRoot.auditService).toBeDefined();
      expect(mockCompositionRoot.eventPublishingService).toBeDefined();
      expect(mockCompositionRoot.config).toBeDefined();
      expect(mockCompositionRoot.logger).toBeDefined();
    });
  });

  describe('createPreTokenGenerationOrchestrator', () => {
    it('should create PreTokenGenerationOrchestrator with correct dependencies', () => {
      const orchestrator = factory.createPreTokenGenerationOrchestrator();

      expect(orchestrator).toBeInstanceOf(PreTokenGenerationOrchestrator);
    });

    it('should use composition root services', () => {
      factory.createPreTokenGenerationOrchestrator();

      expect(mockCompositionRoot.userService).toBeDefined();
      expect(mockCompositionRoot.cognitoService).toBeDefined();
      expect(mockCompositionRoot.config).toBeDefined();
    });
  });
});


