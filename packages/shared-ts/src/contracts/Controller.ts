/**
 * Generic controller function.
 * It adapts transport inputs to application use cases and formats outputs.
 */
export type Controller<Req = unknown, Res = unknown, Ctx = unknown> = (
  req: Req,
  ctx?: Ctx
) => Promise<Res>;

/**
 * Composable middleware for controllers.
 * A middleware wraps a controller to add cross-cutting concerns.
 */
export type Middleware<Req = unknown, Res = unknown, Ctx = unknown> = (
  next: Controller<Req, Res, Ctx>
) => Controller<Req, Res, Ctx>;

/**
 * Controller factory options.
 */
export interface ControllerFactoryOptions<Req = unknown, Res = unknown, Ctx = unknown> {
  /** Middleware chain applied left-to-right. */
  middlewares?: readonly Middleware<Req, Res, Ctx>[];
}

/**
 * Composes a controller with a list of middlewares.
 * Last middleware wraps closest to the core handler.
 *
 * @param core Core controller.
 * @param opts Factory options with middleware list.
 * @returns Composed controller.
 */
export const composeController = <Req, Res, Ctx>(
  core: Controller<Req, Res, Ctx>,
  opts?: ControllerFactoryOptions<Req, Res, Ctx>
): Controller<Req, Res, Ctx> => {
  const chain = [...(opts?.middlewares ?? [])];
  return chain.reduceRight((next, mw) => mw(next), core);
};
