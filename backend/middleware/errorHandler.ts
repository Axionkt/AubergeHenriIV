import { Request, Response, NextFunction } from "express";
import { logError } from "../utils/logger";
import {
  getPgCode,
  isMappedPgCode,
  normalizeError,
} from "../utils/errors/normalizeError";
import { AppError } from "../utils/errors/AppError";
import { ERROR_CODES } from "../utils/errors/errorCodes";

/**
 * Last middleware: normalizes whatever was thrown, logs it once, and sends
 * the client a safe body. 5xx details never leave the server; the request
 * id is included so a user report can be matched to the log line.
 */
export function errorHandler(
  rawErr: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (res.headersSent) return next(rawErr);

  const pgCode = getPgCode(rawErr);
  const err = normalizeError(rawErr);

  const isAppError = err instanceof AppError;
  const status = isAppError ? err.statusCode : 500;
  const isServerError = status >= 500;

  logError(err, { pgCode, mappedPgError: isMappedPgCode(pgCode) });

  res.status(status).json({
    message: isServerError
      ? "Une erreur est survenue. Veuillez réessayer plus tard."
      : err.message,
    code: isAppError
      ? err.code
      : isServerError
        ? ERROR_CODES.INTERNAL_ERROR
        : undefined,
    errors: isAppError ? err.errors : undefined,
    requestId: req.id,
  });
}
