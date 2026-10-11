import { z } from "zod";
import {
  textField,
  toValidationOutcome,
  type ValidationOutcome,
} from "./shared/fields";

export const editUserDetailsRequestSchema = z
  .object({
    firstName: textField(1, 100),
    lastName: textField(1, 100),
  })
  .strict();

export type EditUserDetailsRequest = z.infer<
  typeof editUserDetailsRequestSchema
>;

export function validateEditUserDetailsRequest(
  body: unknown,
): ValidationOutcome<EditUserDetailsRequest> {
  return toValidationOutcome(editUserDetailsRequestSchema.safeParse(body));
}
