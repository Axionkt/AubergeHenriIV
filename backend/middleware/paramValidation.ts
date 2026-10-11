import type { Router } from "express";
import type { z } from "zod";
import {
  idParamSchema,
  toValidationOutcome,
  uuidParamSchema,
} from "../schemas/shared/fields";
import { assertValid } from "../utils/validation";

export function registerUuidParams(router: Router, paramNames: string[]): void {
  for (const paramName of paramNames) {
    registerParam(router, paramName, uuidParamSchema);
  }
}

export function registerIdParams(router: Router, paramNames: string[]): void {
  for (const paramName of paramNames) {
    registerParam(router, paramName, idParamSchema);
  }
}

export function registerParam<T>(
  router: Router,
  paramName: string,
  schema: z.ZodType<T>,
): void {
  router.param(paramName, (req, res, next, value) => {
    const result = assertValid(toValidationOutcome(schema.safeParse(value)));

    req.params[paramName] = result as string;
    next();
  });
}
