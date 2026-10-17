import { FieldError } from "../../schemas/shared/fields";

export class AppError extends Error {
  public statusCode: number;
  public errors?: FieldError[];

  constructor(
    message: string,
    statusCode: number = 500,
    errors?: FieldError[],
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}
