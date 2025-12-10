/**
 * @description Generic HTTP error carrying an optional status code.
 */
export class HttpError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
  }
}

