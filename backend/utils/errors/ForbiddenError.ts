import { AppError } from "./AppError";
import { ERROR_CODES } from "./errorCodes";

export class ForbiddenError extends AppError {
  constructor(
    message = "Vous n'avez pas l'autorisation d'accéder à cette ressource.",
  ) {
    super(403, ERROR_CODES.FORBIDDEN, message);
  }
}
