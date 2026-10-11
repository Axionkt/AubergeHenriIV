import { BadRequestError } from "./errors/BadRequestError";
import {
  VALIDATION_ERROR_MESSAGE,
  type ValidationOutcome,
} from "../schemas/shared/fields";

/**
 * Unwraps a ValidationOutcome, throwing BadRequestError on failure and
 * returning the validated data on success. Centralizes the
 * `if (!result.success) throw new BadRequestError(...)` pattern used at
 * every Zod-validated route, so it only needs updating in one place.
 */
export function assertValid<T>(result: ValidationOutcome<T>): T {
  if (!result.success) {
    // TODO: once BadRequestError supports field-level detail, pass
    // result.errors through here, e.g.:
    //   throw new BadRequestError(VALIDATION_ERROR_MESSAGE, result.errors);
    throw new BadRequestError(VALIDATION_ERROR_MESSAGE);
  }
  return result.data;
}
