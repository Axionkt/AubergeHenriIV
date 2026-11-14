import { AppError } from "./AppError";
import { ERROR_CODES } from "./errorCodes";

export class InternalServerError extends AppError {
  constructor(
    message = "Une erreur est survenue. Veuillez réessayer plus tard.",
  ) {
    super(500, ERROR_CODES.INTERNAL_ERROR, message);
  }
}
