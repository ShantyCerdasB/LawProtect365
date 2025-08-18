/**
 * Options controlling how errors are rendered into HTTP responses.
 */
export interface MapErrorOptions {
  /** Request correlation identifier to echo back to the client. */
  requestId?: string;
  /**
   * Whether to expose error details in the response.
   * Defaults to true when ENV is "dev" or "staging", false otherwise.
   */
  exposeDetails?: boolean;
  /** Extra headers to include in the response. */
  headers?: Record<string, string>;
}