/**
 * Generic application use case.
 * Encapsulates a single business action with an input and an output.
 */
export interface UseCase<I, O, C = unknown> {
  /**
   * Executes the use case.
   * @param input Input payload.
   * @param context Optional execution context (per-request scoped dependencies).
   * @returns Output result.
   */
  execute(input: I, context?: C): Promise<O>;
}

/**
 * Helper to wrap an async function as a UseCase.
 * @param fn Async function implementing the use case.
 * @returns UseCase adapter.
 */
export const asUseCase = <I, O, C = unknown>(
  fn: (input: I, context?: C) => Promise<O>
): UseCase<I, O, C> => ({
  execute: fn
});
