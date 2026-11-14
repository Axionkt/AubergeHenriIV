import { z } from "zod";
import { randomUUID } from "node:crypto";
import { toValidationOutcome, type ValidationOutcome } from "./fields";
import type { MediaType } from "../../models/Media";

// ---------------------------------------------------------------------------
// Filename sanitization
// ---------------------------------------------------------------------------

/**
 * Sanitizes a client-supplied filename before it's ever stored, displayed,
 * or used to build a path. Takes only the final path segment (discarding
 * any directory traversal like "../../etc/passwd" or "..\\..\\file"
 * entirely, not just filtering ".." patterns) and strips control
 * characters / null bytes.
 */
function sanitizeFileName(value: string): string {
  const withoutControlChars = value.replace(/[\u0000-\u001F\u007F]/g, "");
  const segments = withoutControlChars.split(/[/\\]/);
  const lastSegment = segments[segments.length - 1] ?? "";
  return lastSegment.trim();
}

/**
 * Extracts the extension from an already-validated filename. Safe to call
 * on a file that passed fileField/fileArrayField validation, since the
 * schema already guarantees this extension matches the file's real content
 * — no need to separately track a "detected" extension.
 */
export function getFileExtension(filename: string): string {
  const idx = filename.lastIndexOf(".");
  if (idx <= 0) return ""; // no dot, or dot is the first char (e.g. ".env" — no real extension)
  return filename.slice(idx + 1).toLowerCase();
}

// Windows reserved device names — even on a Linux-hosted backend, guard
// against this in case files are ever synced to, served from, or opened on
// a Windows filesystem/client.
const RESERVED_WINDOWS_NAMES = new Set([
  "con",
  "prn",
  "aux",
  "nul",
  "com1",
  "com2",
  "com3",
  "com4",
  "com5",
  "com6",
  "com7",
  "com8",
  "com9",
  "lpt1",
  "lpt2",
  "lpt3",
  "lpt4",
  "lpt5",
  "lpt6",
  "lpt7",
  "lpt8",
  "lpt9",
]);

// ---------------------------------------------------------------------------
// MIME type <-> extension registry. Supported formats are defined centrally
// and grouped by their intended use:
// - Thumbnails: static raster images only.
// - Media: raster images and videos.
// - Plans: PDF documents only.
//
// Each validator derives its allowed MIME types and extensions from this
// registry, keeping the accepted formats explicit and consistent.
//
// NOTE: PDF support is intentionally limited to plan uploads. Magic-byte
// checking verifies the file format but does not guarantee that its contents
// are safe. Formats that can contain active content (such as SVG or PDF)
// require appropriate handling when served back to a browser. In particular,
// consider serving documents with Content-Disposition: attachment and
// X-Content-Type-Options: nosniff rather than rendering them inline.
// ---------------------------------------------------------------------------

const SUPPORTED_MIME_TYPES = {
  "image/jpeg": {
    type: "IMAGE",
    extensions: ["jpg", "jpeg"],
    thumbnail: true,
    plan: true,
    media: true,
  },
  "image/png": {
    type: "IMAGE",
    extensions: ["png"],
    thumbnail: true,
    plan: true,
    media: true,
  },
  "image/webp": {
    type: "IMAGE",
    extensions: ["webp"],
    thumbnail: true,
    plan: true,
    media: true,
  },
  "video/mp4": {
    type: "VIDEO",
    extensions: ["mp4"],
    thumbnail: false,
    plan: false,
    media: true,
  },
  "video/webm": {
    type: "VIDEO",
    extensions: ["webm"],
    thumbnail: false,
    plan: false,
    media: true,
  },
  "application/pdf": {
    type: "DOCUMENT",
    extensions: ["pdf"],
    thumbnail: false,
    plan: true,
    media: false,
  },
} as const satisfies Record<
  string,
  {
    type: MediaType;
    extensions: readonly string[];
    thumbnail: boolean;
    plan: boolean;
    media: boolean;
  }
>;

type SupportedMimeType = keyof typeof SUPPORTED_MIME_TYPES;

export const MIME_TO_MEDIA_TYPE = Object.entries(SUPPORTED_MIME_TYPES).reduce(
  (acc, [mime, config]) => {
    acc[mime as SupportedMimeType] = config.type;
    return acc;
  },
  {} as Record<SupportedMimeType, MediaType>,
);

function isSupportedMimeType(mime: string): mime is SupportedMimeType {
  return Object.prototype.hasOwnProperty.call(SUPPORTED_MIME_TYPES, mime);
}

// Thumbnail
export const THUMBNAIL_TYPE_EXTENSIONS = Object.entries(
  SUPPORTED_MIME_TYPES,
).reduce(
  (acc, [mime, config]) => {
    if (config.thumbnail) {
      acc[mime as SupportedMimeType] = config.extensions;
    }

    return acc;
  },
  {} as Partial<Record<SupportedMimeType, readonly string[]>>,
);

export const THUMBNAIL_MIME_TYPES = Object.entries(SUPPORTED_MIME_TYPES)
  .filter(([, config]) => config.thumbnail)
  .map(([mime]) => mime as SupportedMimeType);

export const MAX_THUMBNAIL_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

// Plan
export const PLAN_TYPE_EXTENSIONS = Object.entries(SUPPORTED_MIME_TYPES).reduce(
  (acc, [mime, config]) => {
    if (config.plan) {
      acc[mime as SupportedMimeType] = config.extensions;
    }

    return acc;
  },
  {} as Partial<Record<SupportedMimeType, readonly string[]>>,
);

export const PLAN_MIME_TYPES = Object.entries(SUPPORTED_MIME_TYPES)
  .filter(([, config]) => config.plan)
  .map(([mime]) => mime as SupportedMimeType);

export const MAX_PLAN_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

// Regular
export const MEDIA_TYPE_EXTENSIONS = Object.entries(
  SUPPORTED_MIME_TYPES,
).reduce(
  (acc, [mime, config]) => {
    if (config.media) {
      acc[mime as SupportedMimeType] = config.extensions;
    }
    return acc;
  },
  {} as Partial<Record<SupportedMimeType, readonly string[]>>,
);

export const MEDIA_MIME_TYPES = Object.entries(SUPPORTED_MIME_TYPES)
  .filter(([, config]) => config.media)
  .map(([mime]) => mime as SupportedMimeType);

export const MAX_MEDIA_SIZE_BYTES = 200 * 1024 * 1024; // 200 MB
export const MAX_MEDIA_AT_ONCE = 20;

// ---------------------------------------------------------------------------
// Real content sniffing — never trust the client-declared mimetype (it's
// just the Content-Type the browser or an attacker set on that multipart
// part) or the filename extension. Detect the actual type from the file's
// magic bytes / internal structure instead.
//
// Uses a dynamic import since `file-type` is ESM-only — this works whether
// this project compiles to CJS or ESM, unlike a static top-level import.
// ---------------------------------------------------------------------------

interface MulterLikeFile {
  buffer?: Buffer;
  path?: string;
}

async function detectActualFileType(file: MulterLikeFile) {
  const { fileTypeFromBuffer, fileTypeFromFile } = await import("file-type");

  if (file.buffer) return fileTypeFromBuffer(file.buffer);
  if (file.path) return fileTypeFromFile(file.path);
  return undefined;
}

// ---------------------------------------------------------------------------
// Multer file shape
// ---------------------------------------------------------------------------

const multerFileShape = {
  fieldname: z.string(),
  originalname: z
    .string()
    .transform(sanitizeFileName)
    .pipe(
      z
        .string()
        .min(1, "Le nom du fichier est requis.")
        .max(255, "Le nom du fichier est trop long.")
        .refine(
          (name) =>
            !RESERVED_WINDOWS_NAMES.has(
              (name.split(".")[0] ?? "").toLowerCase(),
            ),
          "Ce nom de fichier n'est pas autorisé.",
        ),
    ),
  encoding: z.string(),
  mimetype: z.string(),
  // buffer present with memoryStorage; path/destination/filename present
  // with diskStorage — only one set will actually be populated depending on
  // config.
  size: z.number().min(1, "Le fichier est vide."),
  buffer: z.instanceof(Buffer).optional(),
  path: z.string().optional(),
  destination: z.string().optional(),
  filename: z.string().optional(),
};

// ---------------------------------------------------------------------------
// Field builders
//
// IMPORTANT: because content-sniffing needs to read the file's bytes, these
// schemas contain async checks. Callers MUST use `schema.safeParseAsync(...)`
// (via the validateFile helper below), not the synchronous `.safeParse(...)`
// used elsewhere in the validations layer.
// ---------------------------------------------------------------------------

export function fileField(options: {
  allowedMimeTypes: readonly SupportedMimeType[];
  extensionsByMimeType?: Partial<Record<SupportedMimeType, readonly string[]>>;
  maxSizeBytes: number;
}) {
  const {
    allowedMimeTypes,
    extensionsByMimeType = MEDIA_TYPE_EXTENSIONS,
    maxSizeBytes,
  } = options;

  return z
    .object({
      ...multerFileShape,
      mimetype: z
        .string()
        .refine(
          (value) =>
            isSupportedMimeType(value) && allowedMimeTypes.includes(value),
          {
            message: `Le type de fichier doit être l'un des suivants : ${allowedMimeTypes.join(", ")}`,
          },
        ),
      size: multerFileShape.size.max(
        maxSizeBytes,
        `Le fichier ne doit pas dépasser ${Math.floor(maxSizeBytes / (1024 * 1024))} Mo.`,
      ),
    })
    .superRefine(async (file, ctx) => {
      const detected = await detectActualFileType(file);

      if (!detected) {
        ctx.addIssue({
          code: "custom",
          message: "Impossible de déterminer le type réel du fichier.",
          path: ["mimetype"],
        });
        return;
      }

      if (!isSupportedMimeType(detected.mime)) {
        ctx.addIssue({
          code: "custom",
          message: `Le contenu du fichier ne correspond pas à un type autorisé (détecté : ${detected.mime}).`,
          path: ["mimetype"],
        });
        return;
      }

      if (!allowedMimeTypes.includes(detected.mime)) {
        ctx.addIssue({
          code: "custom",
          message: `Le contenu du fichier ne correspond pas à un type autorisé (détecté : ${detected.mime}).`,
          path: ["mimetype"],
        });
      }

      if (detected.mime !== file.mimetype) {
        ctx.addIssue({
          code: "custom",
          message:
            "Le type de fichier déclaré ne correspond pas à son contenu réel.",
          path: ["mimetype"],
        });
      }

      const allowedExts = extensionsByMimeType[detected.mime] ?? [];
      const ext = getFileExtension(file.originalname);

      if (!allowedExts.includes(ext)) {
        ctx.addIssue({
          code: "custom",
          message:
            "L'extension du fichier ne correspond pas à son contenu réel.",
          path: ["originalname"],
        });
      }
    })
    .transform((file) => ({
      ...file,
      type: MIME_TO_MEDIA_TYPE[file.mimetype as SupportedMimeType],
    }));
}

/**
 * The shape returned by fileField after validation — the original Multer
 * fields, with originalname sanitized and mimetype guaranteed to match the
 * file's real content. Use this as the parameter type anywhere a validated
 * single file is consumed downstream (e.g. a media/thumbnail upload
 * service), instead of a separate custom "ValidatedFile" wrapper type.
 */
export type ValidatedUploadFile = z.infer<ReturnType<typeof fileField>>;

export function fileArrayField(options: {
  allowedMimeTypes: readonly SupportedMimeType[];
  extensionsByMimeType?: Partial<Record<SupportedMimeType, readonly string[]>>;
  maxSizeBytes: number;
  maxCount?: number;
  maxTotalSizeBytes?: number;
}) {
  const { maxCount = MAX_MEDIA_AT_ONCE, maxTotalSizeBytes } = options;

  return z
    .array(fileField(options))
    .min(1, "Au moins un fichier est requis.")
    .max(
      maxCount,
      `Vous ne pouvez pas envoyer plus de ${maxCount} fichiers à la fois.`,
    )
    .refine(
      (files) =>
        maxTotalSizeBytes === undefined ||
        files.reduce((sum, f) => sum + f.size, 0) <= maxTotalSizeBytes,
      "La taille totale des fichiers dépasse la limite autorisée.",
    );
}

// ---------------------------------------------------------------------------
// Async validate helper — every consumer of fileField/fileArrayField should
// go through this rather than calling .safeParse() directly, since the
// content-sniffing check above is async.
// ---------------------------------------------------------------------------

export async function validateFile<T>(
  schema: z.ZodType<T>,
  value: unknown,
): Promise<ValidationOutcome<T>> {
  return toValidationOutcome(await schema.safeParseAsync(value));
}

// ---------------------------------------------------------------------------
// Storage filename helper — never store a file under its (sanitized)
// original name. Even after sanitization, original names can still collide
// with each other, contain unicode quirks that behave inconsistently across
// filesystems, or (if ever served back with the original extension) get
// opened in ways that assume that extension is trustworthy. Generate a new
// name server-side from the *detected* type, and keep originalname purely
// as a display label in your DB.
// ---------------------------------------------------------------------------

export function buildSafeStorageFilename(file: ValidatedUploadFile): string {
  return randomUUID() + "." + getFileExtension(file.originalname);
}
