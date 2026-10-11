import { AppError } from "./AppError";

export class ForbiddenError extends AppError {
  constructor(
    message = "Vous n'avez pas l'autorisation d'accéder à cette ressource.",
  ) {
    super(message, 403);
  }
}
