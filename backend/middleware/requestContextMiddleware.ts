import { Request, Response, NextFunction } from "express";
import { requestContext } from "../context/requestContext";
import { sanitizeLogData } from "../utils/logger";

/**
 * Opens an AsyncLocalStorage scope for the request, so the logger can tag
 * any line (even deep in a service) with request id, path, IP and user.
 */
export function requestContextMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  requestContext.run(
    {
      requestId: req.id ?? null,
      method: req.method,
      path: req.originalUrl.split("?")[0],
      ip: req.ip ?? null,
      userId: null,
      query: sanitizeLogData(req.query),
    },
    next,
  );
}
