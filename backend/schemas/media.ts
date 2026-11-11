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
  PLAN_MIME_TYPES,
  PLAN_TYPE_EXTENSIONS,
  MAX_PLAN_SIZE_BYTES,
} from "./shared/fileUpload";

export const VALID_COMMON_SPACE_CONTEXTS = [
  "apartment-common",
  "pro-space-common",
] as const;
export const VALID_CONTEXTS = [
  "apartment",
  "pro-space",
  ...VALID_COMMON_SPACE_CONTEXTS,
] as const;

export type CommonSpaceMediaContext =
  (typeof VALID_COMMON_SPACE_CONTEXTS)[number];
export type MediaContext = (typeof VALID_CONTEXTS)[number];

export const mediaContextParamSchema = z.enum(VALID_CONTEXTS, {
  message: `Le contexte doit être l'un des suivants : ${VALID_CONTEXTS.join(", ")}`,
});

export const singletonMediaRoleParamSchema = z.enum(["thumbnail", "plan"]);

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
// multipart request.
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

const uploadPlanFileSchema = fileField({
  allowedMimeTypes: PLAN_MIME_TYPES,
  extensionsByMimeType: PLAN_TYPE_EXTENSIONS,
  maxSizeBytes: MAX_PLAN_SIZE_BYTES,
});
export async function validateUploadPlanFile(
  file: unknown,
): Promise<ValidationOutcome<z.infer<typeof uploadPlanFileSchema>>> {
  return validateFile(uploadPlanFileSchema, file);
}

const uploadMediaFilesSchema = fileArrayField({
  allowedMimeTypes: MEDIA_MIME_TYPES,
  extensionsByMimeType: MEDIA_TYPE_EXTENSIONS,
  maxSizeBytes: MAX_MEDIA_SIZE_BYTES,
  maxCount: MAX_MEDIA_AT_ONCE,
  maxTotalSizeBytes: 500 * 1024 * 1024,
});
export async function validateUploadMediaFiles(
  files: unknown,
): Promise<ValidationOutcome<z.infer<typeof uploadMediaFilesSchema>>> {
  return validateFile(uploadMediaFilesSchema, files);
}
