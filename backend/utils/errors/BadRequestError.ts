import { FieldError } from "../../schemas/shared/fields";
import { AppError } from "./AppError";
import { ERROR_CODES, ErrorCode } from "./errorCodes";

export class BadRequestError extends AppError {
  constructor(
    message = "La requête est invalide.",
    code: ErrorCode = ERROR_CODES.BAD_REQUEST,
    errors?: FieldError[],
  ) {
    super(400, code, message, errors);
  }
}
