const defineCodes = <T extends string>(codes: readonly T[]) =>
  Object.fromEntries(codes.map((c) => [c, c])) as { [K in T]: K };

export const ERROR_CODES = defineCodes([
  // 400
  "BAD_REQUEST",
  "VALIDATION_ERROR",
  "ALREADY_EXISTS",
  "FILE_TOO_LARGE",
  "TOO_MANY_FILES",
  "UPLOAD_ERROR",
  // pg specific 400
  "INVALID_IDENTIFIER",
  "NUMBER_OUT_OF_RANGE",
  "VALUE_TOO_LONG",
  "REFERENCE_ERROR",
  // 401
  "UNAUTHORIZED",
  // 403
  "FORBIDDEN",
  // 404
  "RESOURCE_NOT_FOUND",
  "ROUTE_NOT_FOUND",
  // 429
  "RATE_LIMITED",
  // 500
  "INTERNAL_ERROR",
] as const);

export type ErrorCode = keyof typeof ERROR_CODES;
