/**
 * Transactional unit of work.
 * The Tx type represents the provider-specific transaction handle.
 */
export interface UnitOfWork<Tx = unknown> {
  /**
   * Runs work within a transactional boundary.
   * The implementation is responsible for begin/commit/rollback semantics.
   *
   * @param work Async function receiving the active transaction handle.
   * @returns Result of the work callback.
   */
  run<R>(work: (tx: Tx) => Promise<R>): Promise<R>;
}

/**
 * Optional context carried within a unit of work.
 */
export interface TransactionalContext<Tx = unknown> {
  /** Provider-specific transaction handle. */
  tx: Tx;
}
