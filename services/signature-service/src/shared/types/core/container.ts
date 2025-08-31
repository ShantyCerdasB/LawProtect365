/**
 * @file container.ts
 * @summary Core container and dependency injection types
 * @description Shared types for dependency injection container and service management
 */

import type { TenantId, UserId } from "@/domain/value-objects/Ids";
import type { Envelope } from "@/domain/entities/Envelope";

/**
 * @summary Application services exposed to controllers
 * @description Provides high-level business operations for envelope management
 * and other domain operations.
 */
export interface Services {
  /** Envelope-related business operations */
  readonly envelopes: {
    /**
     * @summary Creates a new envelope with the specified parameters
     * @description Creates a new envelope with the specified tenant, owner, title, and actor information.
     * @param input - Envelope creation parameters including tenant, owner, title, and actor
     * @param opts - Optional idempotency and TTL settings
     * @returns Promise resolving to the created envelope
     */
    create(
      input: {
        readonly tenantId: TenantId;
        readonly ownerId: UserId;
        readonly title: string;
        readonly actor?: {
          readonly userId?: string;
          readonly email?: string;
          readonly ip?: string;
          readonly userAgent?: string;
          readonly locale?: string;
        };
      },
      opts?: { 
        readonly idempotencyKey?: string; 
        readonly ttlSeconds?: number 
      }
    ): Promise<{ readonly envelope: Envelope }>;
  };
}

/**
 * @summary Container configuration options
 * @description Configuration options for the dependency injection container.
 */
export interface ContainerConfig {
  /** AWS region for all AWS services */
  readonly region: string;
  /** DynamoDB table name */
  readonly tableName: string;
  /** S3 bucket name for document storage */
  readonly bucketName: string;
  /** KMS key ARN for signing operations */
  readonly kmsKeyArn: string;
  /** EventBridge event bus name */
  readonly eventBusName: string;
  /** SSM parameter prefix for configuration */
  readonly ssmPrefix: string;
  /** Whether to enable idempotency */
  readonly enableIdempotency: boolean;
  /** Whether to enable rate limiting */
  readonly enableRateLimit: boolean;
}

/**
 * @summary Service registry interface
 * @description Defines the contract for registering and resolving services
 * in the dependency injection container.
 */
export interface ServiceRegistry {
  /**
   * @summary Register a service with the container
   * @description Registers a service instance with a specific identifier.
   * @param id - Service identifier
   * @param service - Service instance
   */
  register<T>(id: string, service: T): void;

  /**
   * @summary Resolve a service from the container
   * @description Retrieves a service instance by its identifier.
   * @param id - Service identifier
   * @returns Service instance
   * @throws Error if service is not registered
   */
  resolve<T>(id: string): T;

  /**
   * @summary Check if a service is registered
   * @description Verifies if a service with the given identifier is registered.
   * @param id - Service identifier
   * @returns True if service is registered
   */
  has(id: string): boolean;
}

/**
 * @summary Dependency injection container interface
 * @description Defines the contract for the main dependency injection container
 * that manages all application dependencies.
 */
export interface Container {
  /**
   * @summary Get application services
   * @description Returns the high-level application services for business operations.
   * @returns Services interface
   */
  getServices(): Services;

  /**
   * @summary Get service registry
   * @description Returns the service registry for managing dependencies.
   * @returns Service registry
   */
  getRegistry(): ServiceRegistry;

  /**
   * @summary Initialize the container
   * @description Initializes all dependencies and services in the container.
   * @param config - Container configuration
   * @returns Promise that resolves when initialization is complete
   */
  initialize(config: ContainerConfig): Promise<void>;

  /**
   * @summary Dispose the container
   * @description Cleans up resources and disposes of all services.
   * @returns Promise that resolves when disposal is complete
   */
  dispose(): Promise<void>;
}

/**
 * @summary Service factory interface
 * @description Defines the contract for creating service instances.
 */
export interface ServiceFactory<T> {
  /**
   * @summary Create a service instance
   * @description Creates a new instance of the service.
   * @param config - Configuration for the service
   * @returns Service instance
   */
  create(config: unknown): T;
}

/**
 * @summary Service provider interface
 * @description Defines the contract for providing service instances.
 */
export interface ServiceProvider<T> {
  /**
   * @summary Get service instance
   * @description Returns a service instance, creating it if necessary.
   * @returns Service instance
   */
  get(): T;
}
