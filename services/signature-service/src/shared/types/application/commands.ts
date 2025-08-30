/**
 * @file commands.ts
 * @summary Common command types and interfaces
 * @description Shared types for application commands and command handlers
 */

import type { BaseCommand, ActorContext } from "./ports";

/**
 * @description Command handler interface
 */
export interface CommandHandler<TCommand extends BaseCommand, TResult> {
  /** Handle a command */
  handle(command: TCommand): Promise<TResult>;
}

/**
 * @description Command bus interface
 */
export interface CommandBus {
  /** Execute a command */
  execute<TCommand extends BaseCommand, TResult>(command: TCommand): Promise<TResult>;
}

/**
 * @description Command middleware interface
 */
export interface CommandMiddleware<TCommand extends BaseCommand, TResult> {
  /** Process command through middleware */
  process(command: TCommand, next: CommandHandler<TCommand, TResult>): Promise<TResult>;
}

/**
 * @description Command validation result
 */
export interface CommandValidationResult {
  /** Whether the command is valid */
  isValid: boolean;
  /** Validation errors */
  errors: string[];
  /** Validation warnings */
  warnings: string[];
}

/**
 * @description Command validator interface
 */
export interface CommandValidator<TCommand extends BaseCommand> {
  /** Validate a command */
  validate(command: TCommand): CommandValidationResult;
}

/**
 * @description Command authorization result
 */
export interface CommandAuthorizationResult {
  /** Whether the command is authorized */
  isAuthorized: boolean;
  /** Authorization errors */
  errors: string[];
  /** Required permissions */
  requiredPermissions: string[];
}

/**
 * @description Command authorizer interface
 */
export interface CommandAuthorizer<TCommand extends BaseCommand> {
  /** Authorize a command */
  authorize(command: TCommand, actor: ActorContext): CommandAuthorizationResult;
}

/**
 * @description Command audit information
 */
export interface CommandAuditInfo {
  /** Command ID */
  commandId: string;
  /** Command type */
  commandType: string;
  /** Actor information */
  actor: ActorContext;
  /** Execution timestamp */
  executedAt: string;
  /** Execution duration in milliseconds */
  durationMs: number;
  /** Whether the command was successful */
  success: boolean;
  /** Error message if failed */
  error?: string;
}

/**
 * @description Command auditor interface
 */
export interface CommandAuditor {
  /** Audit a command execution */
  audit(info: CommandAuditInfo): Promise<void>;
}

/**
 * @description Command retry configuration
 */
export interface CommandRetryConfig {
  /** Maximum number of retries */
  maxRetries: number;
  /** Retry delay in milliseconds */
  retryDelayMs: number;
  /** Whether to use exponential backoff */
  exponentialBackoff: boolean;
  /** Retryable error types */
  retryableErrors: string[];
}

/**
 * @description Command with retry configuration
 */
export interface RetryableCommand<TCommand extends BaseCommand> {
  /** The command to execute */
  command: TCommand;
  /** Retry configuration */
  retryConfig: CommandRetryConfig;
}
