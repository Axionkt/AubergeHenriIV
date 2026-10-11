import { AppError } from "./AppError";

export class UnauthorizedError extends AppError {
  constructor(
    message = "Vous devez être authentifié pour accéder à cette ressource.",
  ) {
    super(message, 401);
  }
}
