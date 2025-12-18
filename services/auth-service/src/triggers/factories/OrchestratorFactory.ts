/**
 * @fileoverview OrchestratorFactory - Factory for creating trigger orchestrators
 * @summary Centralized factory for instantiating Cognito trigger orchestrators
 * @description
 * Provides factory methods to create orchestrator instances with their required
 * dependencies. Centralizes orchestrator creation logic and reduces coupling
 * between triggers and orchestrators.
 */

import { PreAuthenticationOrchestrator } from '../../application/triggers/PreAuthenticationOrchestrator';
import { PostAuthenticationOrchestrator } from '../../application/triggers/PostAuthenticationOrchestrator';
import { PostConfirmationOrchestrator } from '../../application/triggers/PostConfirmationOrchestrator';
import { PreTokenGenerationOrchestrator } from '../../application/triggers/PreTokenGenerationOrchestrator';
import type { CompositionRoot } from '../../infrastructure/factories/CompositionRoot';

/**
 * @description Factory for creating Cognito trigger orchestrators.
 * @property {CompositionRoot} compositionRoot - Composition root with all dependencies
 */
export class OrchestratorFactory {
  constructor(private readonly compositionRoot: CompositionRoot) {}

  /**
   * @description Creates a PreAuthenticationOrchestrator instance.
   * @returns {PreAuthenticationOrchestrator} Configured orchestrator instance
   */
  createPreAuthenticationOrchestrator(): PreAuthenticationOrchestrator {
    return new PreAuthenticationOrchestrator(
      this.compositionRoot.userService,
      this.compositionRoot.cognitoService,
      this.compositionRoot.config
    );
  }

  /**
   * @description Creates a PostAuthenticationOrchestrator instance.
   * @returns {PostAuthenticationOrchestrator} Configured orchestrator instance
   */
  createPostAuthenticationOrchestrator(): PostAuthenticationOrchestrator {
    return new PostAuthenticationOrchestrator(
      this.compositionRoot.userService,
      this.compositionRoot.cognitoService,
      this.compositionRoot.auditService,
      this.compositionRoot.eventPublishingService
    );
  }

  /**
   * @description Creates a PostConfirmationOrchestrator instance.
   * @returns {PostConfirmationOrchestrator} Configured orchestrator instance
   */
  createPostConfirmationOrchestrator(): PostConfirmationOrchestrator {
    return new PostConfirmationOrchestrator(
      this.compositionRoot.userService,
      this.compositionRoot.cognitoService,
      this.compositionRoot.auditService,
      this.compositionRoot.eventPublishingService,
      this.compositionRoot.config,
      this.compositionRoot.logger
    );
  }

  /**
   * @description Creates a PreTokenGenerationOrchestrator instance.
   * @returns {PreTokenGenerationOrchestrator} Configured orchestrator instance
   */
  createPreTokenGenerationOrchestrator(): PreTokenGenerationOrchestrator {
    return new PreTokenGenerationOrchestrator(
      this.compositionRoot.userService,
      this.compositionRoot.cognitoService,
      this.compositionRoot.config
    );
  }
}


