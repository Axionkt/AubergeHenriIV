import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors/AppError";
import { sanitizeLogData } from "../utils/sanitizeLogData";

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  const isAppError = err instanceof AppError;
  const status = isAppError ? err.statusCode : 500;
  const isServerError = status >= 500;

  if (isServerError) {
    console.error(`[${new Date().toISOString()}]:`, {
      method: req.method,
      path: req.path,
      query: sanitizeLogData(req.query),
      params: sanitizeLogData(req.params),
      ip: req.ip,
      userId: req.user?.sub ?? null,
      status,
      name: err.name,
      message: err.message,
      stack: err.stack,
    });
  }

  res.status(status).json({
    error: isServerError
      ? "Une erreur est survenue. Veuillez réessayer plus tard."
      : err.message,
  });
}
