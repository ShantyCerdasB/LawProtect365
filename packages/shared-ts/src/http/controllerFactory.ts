import type { HandlerFn } from "./httpTypes.js";
import { compose, type ControllerPipeline, type BeforeMiddleware, type AfterMiddleware, type OnErrorMiddleware } from "./middleware.js";

/**
 * Options to build a controller with standardized middlewares.
 */
export interface ControllerFactoryOptions {
  before?: BeforeMiddleware[];
  after?: AfterMiddleware[];
  onError?: OnErrorMiddleware[];
}

/**
 * Creates a controller by composing middlewares around a business handler.
 * @param handler Business handler.
 * @param opts Middleware sets to apply.
 */
export const controllerFactory = (handler: HandlerFn, opts: ControllerFactoryOptions = {}): HandlerFn => {
  const pipe: ControllerPipeline = {
    before: opts.before ?? [],
    after: opts.after ?? [],
    onError: opts.onError ?? []
  };
  return compose(handler, pipe);
};
