import pino from "pino";
import { AppError } from "./errors/AppError";
import { getRequestContext } from "../context/requestContext";

/* -------------------------------------------------------------------------- */
/* Pino logger                                                                */
/* -------------------------------------------------------------------------- */

export const logger = pino({
  // Read directly: config.ts imports this logger, so it can't import config.
  level: process.env.LOG_LEVEL ?? "info",

  timestamp: pino.stdTimeFunctions.isoTime,

  redact: {
    paths: [
      "req.headers.cookie",
      "req.headers.authorization",
      "*.password",
      "*.token",
      "*.accessToken",
      "*.refreshToken",
    ],
    censor: "[REDACTED]",
  },

  serializers: {
    err: pino.stdSerializers.err,
  },
});

/* -------------------------------------------------------------------------- */
/* Sanitizer                                                                  */
/* -------------------------------------------------------------------------- */

const SENSITIVE = /token|password|secret|authorization|cookie|key|hash/i;

/** Recursively redacts any key that looks like a secret (token, password, cookie, ...). */
export function sanitizeLogData(
  obj: Record<string, unknown>,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => {
      const normalizedKey = key.toLowerCase();

      if (SENSITIVE.test(normalizedKey)) {
        return [key, "[REDACTED]"];
      }

      if (
        value !== null &&
        typeof value === "object" &&
        !Array.isArray(value)
      ) {
        return [key, sanitizeLogData(value as Record<string, unknown>)];
      }

      if (Array.isArray(value)) {
        return [
          key,
          value.map((item) =>
            item !== null && typeof item === "object"
              ? sanitizeLogData(item as Record<string, unknown>)
              : item,
          ),
        ];
      }

      return [key, value];
    }),
  );
}

/* -------------------------------------------------------------------------- */
/* Security Events                                                            */
/* -------------------------------------------------------------------------- */

interface SecurityEventDetails {
  operation?: string;
  reason?: string;
  status?: number;
}

/** Warn-level line for brute-force and abuse signals; never includes PII. */
export function logSecurityEvent(
  event: string,
  details: SecurityEventDetails = {},
): void {
  const context = getRequestContext();

  logger.warn({
    event,
    requestId: context?.requestId ?? null,
    method: context?.method ?? null,
    operation: details.operation ?? null,
    reason: details.reason ?? null,
    status: details.status ?? null,
  });
}

/* -------------------------------------------------------------------------- */
/* Log Error                                                                  */
/* -------------------------------------------------------------------------- */

interface LogErrorOptions {
  forceServerError?: boolean;
  operation?: string;
  pgCode?: string | null;
  mappedPgError?: boolean;
}

/**
 * Logs anything that was thrown. Callers outside the error handler (cron,
 * background emails, settle) pass raw `unknown` values; non-Errors are
 * wrapped so pino's err serializer always gets a stack.
 */
export function logError(raw: unknown, options: LogErrorOptions = {}): void {
  const err = raw instanceof Error ? raw : new Error(String(raw));
  const isAppError = err instanceof AppError;

  const status = options.forceServerError
    ? 500
    : isAppError
      ? err.statusCode
      : 500;

  const context = getRequestContext();

  const logBase = {
    requestId: context?.requestId ?? null,
    method: context?.method ?? null,
    path: context?.path ?? null,
    query: context?.query ?? {},
    ip: context?.ip ?? null,
    userId: context?.userId ?? null,
    operation: options.operation ?? null,
    status,
  };

  if (status >= 500) {
    logger.error({
      ...logBase,
      err,
      pgCode: options.pgCode ?? null,
    });
  } else if (options.mappedPgError) {
    logger.warn({
      ...logBase,
      pgCode: options.pgCode ?? null,
    });
  } else if (status === 403) {
    logSecurityEvent("authorization_denied", {
      operation: options.operation,
      status: 403,
    });
  } else if (status === 401) {
    logger.info({
      event: "authentication_rejected",
      requestId: context?.requestId ?? null,
      method: context?.method ?? null,
      status: 401,
    });
  }
}
