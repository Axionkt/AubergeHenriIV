import { AppError } from "./AppError";

export class NotFoundError extends AppError {
  constructor(message = "La ressource demandée est introuvable.") {
    super(message, 404);
  }
}
