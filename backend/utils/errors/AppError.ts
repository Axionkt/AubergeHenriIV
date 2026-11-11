import { FieldError } from "../../schemas/shared/fields";
import { ErrorCode } from "./errorCodes";

export class AppError extends Error {
  public statusCode: number;
  public code: ErrorCode;
  public errors?: FieldError[];

  constructor(
    statusCode: number = 500,
    code: ErrorCode,
    message: string,
    errors?: FieldError[],
  ) {
    super(message);
    this.name = new.target.name;
    this.statusCode = statusCode;
    this.code = code;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}
