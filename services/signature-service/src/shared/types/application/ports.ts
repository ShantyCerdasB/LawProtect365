/**
 * @file ports.ts
 * @summary Common port types and interfaces
 * @description Shared types for application ports and interfaces
 */

import type { TenantId, UserId } from "@/domain/value-objects/Ids";

/**
 * @description Base port interface
 */
export interface BasePort {
  /** Port name for identification */
  readonly name: string;
  /** Port version for compatibility */
  readonly version: string;
}

/**
 * @description Command port interface for write operations
 */
export interface CommandPort<TCommand, TResult> extends BasePort {
  /** Execute a command */
  execute(command: TCommand): Promise<TResult>;
}

/**
 * @description Query port interface for read operations
 */
export interface QueryPort<TQuery, TResult> extends BasePort {
  /** Execute a query */
  query(query: TQuery): Promise<TResult>;
}

/**
 * @description Repository port interface
 */
export interface RepositoryPort<TEntity, TId, TContext = undefined> extends BasePort {
  /** Find entity by ID */
  findById(id: TId, context?: TContext): Promise<TEntity | null>;
  /** Check if entity exists */
  exists(id: TId, context?: TContext): Promise<boolean>;
  /** Create entity */
  create(entity: TEntity, context?: TContext): Promise<TEntity>;
  /** Update entity */
  update(entity: TEntity, context?: TContext): Promise<TEntity>;
  /** Delete entity */
  delete(id: TId, context?: TContext): Promise<void>;
}

/**
 * @description Event publisher port interface
 */
export interface EventPublisherPort<TEvent> extends BasePort {
  /** Publish an event */
  publish(event: TEvent): Promise<void>;
  /** Publish multiple events */
  publishBatch(events: TEvent[]): Promise<void>;
}

/**
 * @description Event subscriber port interface
 */
export interface EventSubscriberPort<TEvent> extends BasePort {
  /** Subscribe to events */
  subscribe(handler: (event: TEvent) => Promise<void>): Promise<void>;
  /** Unsubscribe from events */
  unsubscribe(): Promise<void>;
}

/**
 * @description Storage port interface
 */
export interface StoragePort<TKey, TValue> extends BasePort {
  /** Get value by key */
  get(key: TKey): Promise<TValue | null>;
  /** Set value by key */
  set(key: TKey, value: TValue): Promise<void>;
  /** Delete value by key */
  delete(key: TKey): Promise<void>;
  /** Check if key exists */
  has(key: TKey): Promise<boolean>;
}

/**
 * @description Actor context for operations
 */
export interface ActorContext {
  /** User ID of the actor */
  userId?: string;
  /** Email of the actor */
  email?: string;
  /** IP address of the actor */
  ip?: string;
  /** User agent of the actor */
  userAgent?: string;
  /** Locale of the actor */
  locale?: string;
  /** Session ID of the actor */
  sessionId?: string;
  /** Request ID for tracing */
  requestId?: string;
}

/**
 * @description Base command interface
 */
export interface BaseCommand {
  /** Tenant ID for multi-tenancy */
  tenantId: TenantId;
  /** Actor context */
  actor?: ActorContext;
  /** Command timestamp */
  timestamp?: string;
}

/**
 * @description Base query interface
 */
export interface BaseQuery {
  /** Tenant ID for multi-tenancy */
  tenantId: TenantId;
  /** Actor context */
  actor?: ActorContext;
  /** Query timestamp */
  timestamp?: string;
}

/**
 * @description Base result interface
 */
export interface BaseResult {
  /** Result timestamp */
  timestamp: string;
  /** Success indicator */
  success: boolean;
  /** Error message if failed */
  error?: string;
}

/**
 * @description Command result with data
 */
export interface CommandResult<T> extends BaseResult {
  /** Command result data */
  data: T;
}

/**
 * @description Query result with data
 */
export interface QueryResult<T> extends BaseResult {
  /** Query result data */
  data: T;
}
