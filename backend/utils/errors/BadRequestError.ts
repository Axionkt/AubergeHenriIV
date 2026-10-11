import { AppError } from "./AppError";

export class BadRequestError extends AppError {
  constructor(message = "La requête est invalide.") {
    super(message, 400);
  }
}
