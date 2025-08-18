/**
 * High-resolution timer for measuring durations.
 */
export interface Timer {
  /** Ends the timer and returns elapsed milliseconds. */
  end(): number;
}

/**
 * Starts a high-resolution timer.
 */
export const startTimer = (): Timer => {
  const start = process.hrtime.bigint();
  return {
    end(): number {
      const end = process.hrtime.bigint();
      const ns = Number(end - start);
      return ns / 1_000_000;
    }
  };
};
