import { Request, Response, NextFunction, RequestHandler } from "express";

/**
 * Typing helper only. Express 5 already forwards rejected promises to the
 * error handler, so this just lets handlers declare their param/body types.
 */
export function asyncHandler<
  P = Record<string, string>,
  ResBody = unknown,
  ReqBody = unknown,
  ReqQuery = Record<string, unknown>,
>(
  fn: (
    req: Request<P, ResBody, ReqBody, ReqQuery>,
    res: Response<ResBody>,
    next: NextFunction,
  ) => Promise<void>,
): RequestHandler<P, ResBody, ReqBody, ReqQuery> {
  return fn;
}
