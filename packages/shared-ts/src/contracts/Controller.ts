/**
 * Represents a value that may be returned synchronously (`T`) or asynchronously (`Promise<T>`).
 *
 * @typeParam T - The wrapped value type.
 */
type MaybePromise<T> = T | Promise<T>;

/**
 * Generic controller function.
 *
 * @remarks
 * The controller may return the resolved output type `Out` directly or a `Promise<Out>`.
 * By design, `Out` is considered the already-resolved result that flows through the `after` middlewares.
 *
 * @typeParam Req - Request/input type.
 * @typeParam Out - Resolved output/result type.
 * @typeParam Ctx - Optional execution context type.
 *
 * @param req - The input request.
 * @param ctx - Optional execution context.
 * @returns The resolved output or a promise of it.
 */
export type Controller<Req = unknown, Out = unknown, Ctx = unknown> = (
  req: Req,
  ctx?: Ctx
) => MaybePromise<Out>;

/**
 * Classic middleware that wraps a {@link Controller}.
 *
 * @remarks
 * The last middleware in the array wraps closest to the core controller.
 *
 * @typeParam Req - Request/input type.
 * @typeParam Out - Resolved output/result type.
 * @typeParam Ctx - Optional execution context type.
 *
 * @param next - The next controller to invoke.
 * @returns A new controller with the middleware applied.
 */
export type ControllerMiddleware<Req = unknown, Out = unknown, Ctx = unknown> = (
  next: Controller<Req, Out, Ctx>
) => Controller<Req, Out, Ctx>;

/**
 * Phase-based "before" middleware executed prior to the core controller.
 *
 * @remarks
 * Useful for validation, request enrichment, or other side effects.
 *
 * @typeParam Req - Request/input type.
 * @typeParam Ctx - Optional execution context type.
 *
 * @param req - The input request (may be mutated).
 * @param ctx - Optional execution context (may be mutated).
 * @returns Nothing or a promise of nothing.
 */
export type CtrBeforeMiddleware<Req = unknown, Ctx = unknown> = (
  req: Req,
  ctx?: Ctx
) => MaybePromise<void>;

/**
 * Phase-based "after" middleware executed after the core controller.
 *
 * @remarks
 * Receives the already resolved result (`Out`). If it returns `undefined`,
 * the original result is preserved; otherwise, the returned `Out` replaces it.
 *
 * @typeParam Req - Request/input type.
 * @typeParam Out - Resolved output/result type.
 * @typeParam Ctx - Optional execution context type.
 *
 * @param req - The original request.
 * @param res - The resolved controller result.
 * @param ctx - Optional execution context.
 * @returns A transformed result, `void` to preserve the original, or a promise of either.
 */
export type CtrAfterMiddleware<Req = unknown, Out = unknown, Ctx = unknown> = (
  req: Req,
  res: Out,
  ctx?: Ctx
) => MaybePromise<Out | void>;

/**
 * Phase-based error middleware executed when any previous phase throws.
 *
 * @remarks
 * If it returns a defined `Out`, the error is considered handled and that
 * value is returned. Otherwise, the error is rethrown to the next handler.
 *
 * @typeParam Req - Request/input type.
 * @typeParam Out - Resolved output/result type.
 * @typeParam Ctx - Optional execution context type.
 *
 * @param error - The error thrown by a previous phase.
 * @param req - The original request.
 * @param ctx - Optional execution context.
 * @returns A fallback result, `void` to rethrow, or a promise of either.
 */
export type CtrOnErrorMiddleware<Req = unknown, Out = unknown, Ctx = unknown> = (
  error: unknown,
  req: Req,
  ctx?: Ctx
) => MaybePromise<Out | void>;

/**
 * Factory options used to compose a controller with both classic and phase-based middlewares.
 *
 * @remarks
 * Execution order for each request:
 * 1. `before` middlewares (in declaration order)
 * 2. `middlewares` chain (left to right)
 * 3. core controller (`core`)
 * 4. `after` middlewares (in declaration order)
 * 5. If any error occurs in steps 1–4, `onError` middlewares run (in order).
 *    The first one returning a defined result short-circuits the chain.
 *
 * @typeParam Req - Request/input type.
 * @typeParam Out - Resolved output/result type.
 * @typeParam Ctx - Optional execution context type.
 */
export interface ControllerFactoryOptions<Req = unknown, Out = unknown, Ctx = unknown> {
  /** Classic middleware chain applied left-to-right. */
  middlewares?: readonly ControllerMiddleware<Req, Out, Ctx>[];
  /** Executed before the core controller. */
  before?: readonly CtrBeforeMiddleware<Req, Ctx>[];
  /** Executed after the core controller; may transform the result. */
  after?: readonly CtrAfterMiddleware<Req, Out, Ctx>[];
  /** Error handlers; the first returning a result handles the error. */
  onError?: readonly CtrOnErrorMiddleware<Req, Out, Ctx>[];
}

/**
 * Composes a controller with classic and phase-based middlewares.
 *
 * @remarks
 * Composition rules:
 * - A wrapper is built around the core to apply `before`, `after`, and `onError`.
 * - That wrapper is then passed through the `middlewares` chain, so the
 *   last middleware wraps closest to the core.
 *
 * @typeParam Req - Request/input type.
 * @typeParam Out - Resolved output/result type.
 * @typeParam Ctx - Optional execution context type.
 *
 * @param core - The core business controller.
 * @param opts - Middleware configuration.
 * @returns A composed controller with all configured middlewares applied.
 *
 * @example
 * ```ts
 * const core: Controller<number, string> = async (n) => String(n * 2);
 *
 * const logBefore: CtrBeforeMiddleware<number> = (req) => {
 *   console.log("before:", req);
 * };
 *
 * const uppercaseAfter: CtrAfterMiddleware<number, string> = (_req, res) => {
 *   return res.toUpperCase();
 * };
 *
 * const mw: ControllerMiddleware<number, string> = (next) => async (req) => {
 *   const r = await next(req);
 *   return `mw(${r})`;
 * };
 *
 * const handler = composeController(core, {
 *   before: [logBefore],
 *   after: [uppercaseAfter],
 *   middlewares: [mw],
 * });
 *
 * const out = await handler(7); // -> "mw(14)"
 * ```
 */
export const composeController = <Req, Out, Ctx>(
  core: Controller<Req, Out, Ctx>,
  opts: ControllerFactoryOptions<Req, Out, Ctx> = {}
): Controller<Req, Out, Ctx> => {
  const befores = [...(opts.before ?? [])];
  const afters = [...(opts.after ?? [])];
  const onErrors = [...(opts.onError ?? [])];
  const chain = [...(opts.middlewares ?? [])];

  // Wrapper around the core that applies phase-based middlewares
  const phasedCore: Controller<Req, Out, Ctx> = async (req, ctx) => {
    try {
      // BEFORE phase
      for (const b of befores) await b(req, ctx);

      // CORE phase
      let result = await core(req, ctx); // type: Out

      // AFTER phase
      for (const a of afters) {
        const maybe = await a(req, result, ctx); // 'result' is already resolved (Out)
        if (typeof maybe !== "undefined") result = maybe;
      }

      return result;
    } catch (err) {
      // ON ERROR phase
      for (const oe of onErrors) {
        const maybe = await oe(err, req, ctx);
        if (typeof maybe !== "undefined") return maybe as Out;
      }
      throw err;
    }
  };

  // Apply classic middlewares (the last one wraps closest to the core)
  return chain.reduceRight<Controller<Req, Out, Ctx>>(
    (next, mw) => mw(next),
    phasedCore
  );
};
