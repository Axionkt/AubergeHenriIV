import multer from "multer";
import { AppError } from "./AppError";
import {
  MAX_MEDIA_AT_ONCE,
  MAX_MEDIA_SIZE_BYTES,
  MAX_PLAN_SIZE_BYTES,
  MAX_THUMBNAIL_SIZE_BYTES,
} from "../../schemas/shared/fileUpload";
import { ERROR_CODES, ErrorCode } from "./errorCodes";

/* -------------------------------------------------------------------------- */
/* Multer                                                                     */
/* -------------------------------------------------------------------------- */

const toMb = (bytes: number) => Math.floor(bytes / 1024 / 1024);

function multerToAppError(err: multer.MulterError): AppError {
  const field = err.field ?? "files";

  switch (err.code) {
    case "LIMIT_FILE_SIZE": {
      const max =
        { thumbnail: MAX_THUMBNAIL_SIZE_BYTES, plan: MAX_PLAN_SIZE_BYTES }[
          field
        ] ?? MAX_MEDIA_SIZE_BYTES;

      const message = `Fichier trop volumineux (${toMb(max)} Mo maximum)`;

      return new AppError(413, ERROR_CODES.FILE_TOO_LARGE, message, [
        { path: field, message },
      ]);
    }

    case "LIMIT_FILE_COUNT": {
      const message = `Trop de fichiers (${MAX_MEDIA_AT_ONCE} maximum à la fois)`;

      return new AppError(400, ERROR_CODES.TOO_MANY_FILES, message, [
        { path: "files", message },
      ]);
    }

    case "LIMIT_UNEXPECTED_FILE": {
      const message = "Champ de fichier inattendu";

      return new AppError(400, ERROR_CODES.VALIDATION_ERROR, message, [
        { path: "files", message },
      ]);
    }

    default: {
      const message = "Échec de l'envoi des fichiers";

      return new AppError(400, ERROR_CODES.UPLOAD_ERROR, message, [
        { path: "files", message },
      ]);
    }
  }
}

/* -------------------------------------------------------------------------- */
/* Postgres                                                                   */
/* -------------------------------------------------------------------------- */

// Client-caused Postgres errors. Anything not listed stays a 500.
const PG_ERRORS: Record<
  string,
  { status: number; code: ErrorCode; message: string }
> = {
  "22P02": {
    status: 400,
    code: ERROR_CODES.INVALID_IDENTIFIER,
    message: "Identifiant invalide",
  },
  "22003": {
    status: 400,
    code: ERROR_CODES.NUMBER_OUT_OF_RANGE,
    message: "Valeur numérique hors limites",
  },
  "22001": {
    status: 400,
    code: ERROR_CODES.VALUE_TOO_LONG,
    message: "Valeur trop longue",
  },
  "23505": {
    status: 409,
    code: ERROR_CODES.ALREADY_EXISTS,
    message: "Cet élément existe déjà",
  },
  "23503": {
    status: 409,
    code: ERROR_CODES.REFERENCE_ERROR,
    message: "Élément lié introuvable ou encore utilisé",
  },
  // CHECK constraints (migrations 006/007) mirror Zod, so hitting one
  // means a bypassed or buggy validator: still the client's input.
  "23514": {
    status: 400,
    code: ERROR_CODES.VALIDATION_ERROR,
    message: "Valeur non autorisée",
  },
};

/** Different DB libs expose the SQLSTATE in different places. */
export function getPgCode(err: unknown): string | undefined {
  const e = err as {
    code?: unknown;
    cause?: { code?: unknown };
    original?: { code?: unknown };
  };

  const candidate = e?.code ?? e?.cause?.code ?? e?.original?.code;

  // SQLSTATEs are 5 chars and always contain a digit; the digit check keeps
  // Node system codes like "EXDEV" from being mistaken for one.
  return typeof candidate === "string" &&
    /^[0-9A-Z]{5}$/.test(candidate) &&
    /\d/.test(candidate)
    ? candidate
    : undefined;
}

export function isMappedPgCode(code: string | undefined): boolean {
  return code !== undefined && code in PG_ERRORS;
}

/* -------------------------------------------------------------------------- */
/* Normalisation                                                              */
/* -------------------------------------------------------------------------- */

const MALFORMED_MULTIPART =
  /^(Multipart:|Unexpected end of form|Malformed part header|Part terminated early|Malformed urlencoded form)/;

/**
 * Turns anything that was thrown into either an AppError (expected, client
 * safe) or a plain Error (unexpected, treated as a 500).
 */
export function normalizeError(err: unknown): Error {
  if (err instanceof AppError) return err;

  if (err instanceof multer.MulterError) return multerToAppError(err);

  // Malformed multipart bodies surface from busboy as plain Errors.
  // They're client mistakes, not server faults.
  if (err instanceof Error && MALFORMED_MULTIPART.test(err.message)) {
    return new AppError(
      400,
      ERROR_CODES.BAD_REQUEST,
      "Requête d'envoi invalide",
      undefined,
    );
  }

  // body-parser / express.json() errors carry a 4xx status and a `type`.
  const http = err as {
    status?: unknown;
    statusCode?: unknown;
    type?: unknown;
  };

  const httpStatus =
    typeof http?.status === "number"
      ? http.status
      : typeof http?.statusCode === "number"
        ? http.statusCode
        : undefined;

  if (httpStatus && httpStatus >= 400 && httpStatus < 500) {
    if (http.type === "entity.too.large") {
      return new AppError(
        413,
        ERROR_CODES.BAD_REQUEST,
        "Requête trop volumineuse",
        undefined,
      );
    }

    if (http.type === "entity.parse.failed") {
      return new AppError(
        400,
        ERROR_CODES.BAD_REQUEST,
        "Corps de requête invalide",
        undefined,
      );
    }

    return new AppError(
      httpStatus,
      ERROR_CODES.BAD_REQUEST,
      "Requête invalide",
      undefined,
    );
  }

  const pgCode = getPgCode(err);

  if (pgCode && PG_ERRORS[pgCode]) {
    const mappedError = PG_ERRORS[pgCode];

    return new AppError(
      mappedError.status,
      mappedError.code,
      mappedError.message,
      undefined,
    );
  }

  // Unknown: make sure downstream code always gets a real Error.
  return err instanceof Error ? err : new Error(String(err));
}
