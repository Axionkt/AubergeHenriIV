import { z } from "zod";
import {
  textField,
  toValidationOutcome,
  type ValidationOutcome,
} from "./shared/fields";

// Assumed to be an admin-supplied display date (e.g. backdating a
// testimonial to when it was originally given), not the DB insert
// timestamp. Full ISO 8601 datetime.
const createdAtMessage = "La date doit être une date ISO 8601 valide.";

// ---------------------------------------------------------------------------
// Create — authorName/text required. createdAt is optional on input, but
// the schema itself fills in "now" when omitted, so CreateReviewRequest
// always has a concrete string — no undefined-handling needed downstream.
// ---------------------------------------------------------------------------

export const createReviewRequestSchema = z
  .object({
    authorName: textField(1, 100),
    text: textField(1, 5000),
    createdAt: z.iso
      .date({ message: createdAtMessage })
      .nullable()
      .transform((value) => value ?? new Date().toISOString().split("T")[0]),
  })
  .strict();

export type CreateReviewRequest = z.infer<typeof createReviewRequestSchema>;

export function validateCreateReviewRequest(
  body: unknown,
): ValidationOutcome<CreateReviewRequest> {
  return toValidationOutcome(createReviewRequestSchema.safeParse(body));
}

// ---------------------------------------------------------------------------
// Update — every field optional. Here, an omitted createdAt means "leave
// the existing value untouched" (same convention as apartment/proSpace
// updates), not "reset to today".
// ---------------------------------------------------------------------------

export const updateReviewRequestSchema = z
  .object({
    authorName: textField(1, 100).optional(),
    text: textField(1, 5000).optional(),
    createdAt: z.iso.date({ message: createdAtMessage }).optional(),
  })
  .strict();

export type UpdateReviewRequest = z.infer<typeof updateReviewRequestSchema>;

export function validateUpdateReviewRequest(
  body: unknown,
): ValidationOutcome<UpdateReviewRequest> {
  return toValidationOutcome(updateReviewRequestSchema.safeParse(body));
}
