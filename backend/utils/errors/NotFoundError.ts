import { AppError } from "./AppError";
import { ERROR_CODES } from "./errorCodes";

export class NotFoundError extends AppError {
  constructor(message = "La ressource demandée est introuvable.") {
    super(404, ERROR_CODES.RESOURCE_NOT_FOUND, message);
  }
}
