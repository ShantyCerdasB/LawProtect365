import type { ApiEvent, ApiResponse, HandlerFn } from "./httpTypes.js";

/**
 * Runs before the business handler. Returning a response short-circuits the pipeline.
 */
export type BeforeMiddleware = (evt: ApiEvent) => void | ApiResponse | Promise<void | ApiResponse>;

/**
 * Runs after the business handler. Must return the (possibly modified) response.
 */
export type AfterMiddleware = (evt: ApiEvent, res: ApiResponse) => ApiResponse | Promise<ApiResponse>;

/**
 * Runs when an exception bubbles from the handler or before middlewares.
 * Must return a response.
 */
export type OnErrorMiddleware = (evt: ApiEvent, err: unknown) => ApiResponse | Promise<ApiResponse>;

/**
 * Middleware pipeline configuration.
 */
export interface ControllerPipeline {
  before?: BeforeMiddleware[];
  after?: AfterMiddleware[];
  onError?: OnErrorMiddleware[];
}

/**
 * Composes a handler with the provided middlewares.
 * @param base Business handler.
 * @param pipe Pipeline definition.
 */
export const compose = (base: HandlerFn, pipe: ControllerPipeline = {}): HandlerFn => {
  const before = pipe.before ?? [];
  const after = pipe.after ?? [];
  const onError = pipe.onError ?? [];

  return async (evt: ApiEvent): Promise<ApiResponse> => {
    try {
      for (const b of before) {
        // eslint-disable-next-line no-await-in-loop
        const maybe = await b(evt);
        if (maybe) return maybe;
      }
      let res = await base(evt);
      for (const a of after) {
        // eslint-disable-next-line no-await-in-loop
        res = await a(evt, res);
      }
      return res;
    } catch (err) {
      for (const h of onError) {
        try {
          // eslint-disable-next-line no-await-in-loop
          return await h(evt, err);
        } catch {
          // fallthrough to next onError
        }
      }
      throw err;
    }
  };
};
