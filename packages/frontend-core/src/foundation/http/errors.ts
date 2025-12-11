/**
 * @description Generic HTTP error carrying an error code, status code, and optional error data.
 */
export class HttpError extends Error {
  constructor(
    readonly code: string,
    readonly status?: number,
    readonly data?: unknown
  ) {
    super(code);
    this.name = 'HttpError';
  }
}

