import { AppError } from "./AppError";

export class InternalServerError extends AppError {
  constructor(
    message = "Une erreur est survenue. Veuillez réessayer plus tard.",
  ) {
    super(message, 500);
  }
}
