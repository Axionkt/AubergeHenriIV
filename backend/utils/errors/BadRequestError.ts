import { FieldError } from "../../schemas/shared/fields";
import { AppError } from "./AppError";

export class BadRequestError extends AppError {
  constructor(message = "La requête est invalide.", errors?: FieldError[]) {
    super(message, 400, errors);
  }
}
