import { AppError } from "./AppError";
import { ERROR_CODES } from "./errorCodes";

export class UnauthorizedError extends AppError {
  constructor(
    message = "Vous devez être authentifié pour accéder à cette ressource.",
  ) {
    super(401, ERROR_CODES.UNAUTHORIZED, message);
  }
}
