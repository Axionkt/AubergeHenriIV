import { z } from "zod";
import {
  toValidationOutcome,
  uuidArrayField,
  ValidationOutcome,
} from "./shared/fields";
import {
  fileArrayField,
  THUMBNAIL_MIME_TYPES,
  THUMBNAIL_TYPE_EXTENSIONS,
  MAX_THUMBNAIL_SIZE_BYTES,
  MEDIA_MIME_TYPES,
  MEDIA_TYPE_EXTENSIONS,
  MAX_MEDIA_SIZE_BYTES,
  fileField,
  MAX_MEDIA_AT_ONCE,
  validateFile,
} from "./shared/fileUpload";

export const VALID_CONTEXTS = [
  "apartment",
  "pro-space",
  "common-space",
] as const;

export type MediaContext = (typeof VALID_CONTEXTS)[number];

export const mediaContextParamSchema = z.enum(VALID_CONTEXTS, {
  message: `Le contexte doit être l'un des suivants : ${VALID_CONTEXTS.join(", ")}`,
});

// ---------------------------------------------------------------------------
// Body schemas for bulk media operations (reorder / delete), both operating
// on a list of media ids.
// ---------------------------------------------------------------------------

export const reorderMediaRequestSchema = z
  .object({
    mediaIds: uuidArrayField(),
  })
  .strict();

export type ReorderMediaRequest = z.infer<typeof reorderMediaRequestSchema>;

export function validateReorderMediaRequest(
  body: unknown,
): ValidationOutcome<ReorderMediaRequest> {
  return toValidationOutcome(reorderMediaRequestSchema.safeParse(body));
}

export const deleteMediaRequestSchema = z
  .object({
    mediaIds: uuidArrayField(),
  })
  .strict();

export type DeleteMediaRequest = z.infer<typeof deleteMediaRequestSchema>;

export function validateDeleteMediaRequest(
  body: unknown,
): ValidationOutcome<DeleteMediaRequest> {
  return toValidationOutcome(deleteMediaRequestSchema.safeParse(body));
}

// ---------------------------------------------------------------------------
// Media upload — validates req.files after Multer has already parsed the
// multipart request. Adjust maxCount / MAX_IMAGE_SIZE_BYTES to your actual
// limits.
// ---------------------------------------------------------------------------

const uploadThumbnailFileSchema = fileField({
  allowedMimeTypes: THUMBNAIL_MIME_TYPES,
  extensionsByMimeType: THUMBNAIL_TYPE_EXTENSIONS,
  maxSizeBytes: MAX_THUMBNAIL_SIZE_BYTES,
});

export async function validateUploadThumbnailFile(
  file: unknown,
): Promise<ValidationOutcome<z.infer<typeof uploadThumbnailFileSchema>>> {
  return validateFile(uploadThumbnailFileSchema, file);
}

const uploadMediaFilesSchema = fileArrayField({
  allowedMimeTypes: MEDIA_MIME_TYPES,
  extensionsByMimeType: MEDIA_TYPE_EXTENSIONS,
  maxSizeBytes: MAX_MEDIA_SIZE_BYTES,
  maxCount: MAX_MEDIA_AT_ONCE,
});

export async function validateUploadMediaFiles(
  files: unknown,
): Promise<ValidationOutcome<z.infer<typeof uploadMediaFilesSchema>>> {
  return validateFile(uploadMediaFilesSchema, files);
}
