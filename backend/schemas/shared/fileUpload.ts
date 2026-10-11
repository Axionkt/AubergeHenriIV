import { z } from "zod";
import { toValidationOutcome, type ValidationOutcome } from "./fields";

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
export function sanitizeFileName(value: string): string {
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
// Mime type <-> extension registries. Thumbnails are always static images;
// media can additionally be video. Kept as two separate maps (rather than
// deriving one from the other) so each stays an explicit, readable list of
// exactly what it accepts.
//
// NOTE: only raster image + the two listed video containers are supported
// here deliberately. If you ever add SVG, PDF, or other formats that can
// embed active content (scripts, XML entities, etc.), those need their own
// sanitization pass beyond what this file does — magic-byte checking alone
// doesn't make an SVG safe to serve back to a browser.
// ---------------------------------------------------------------------------

const IMAGE_TYPE_EXTENSIONS: Record<string, readonly string[]> = {
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/webp": ["webp"],
};

const VIDEO_TYPE_EXTENSIONS: Record<string, readonly string[]> = {
  "video/mp4": ["mp4"],
  "video/webm": ["webm"],
};

export const THUMBNAIL_TYPE_EXTENSIONS: Record<string, readonly string[]> = {
  ...IMAGE_TYPE_EXTENSIONS,
};

export const MEDIA_TYPE_EXTENSIONS: Record<string, readonly string[]> = {
  ...IMAGE_TYPE_EXTENSIONS,
  ...VIDEO_TYPE_EXTENSIONS,
};

export const THUMBNAIL_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const MEDIA_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/webm",
];

export const MAX_THUMBNAIL_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
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
  // your Multer storage engine config.
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
  allowedMimeTypes: readonly string[];
  extensionsByMimeType?: Record<string, readonly string[]>;
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
      mimetype: z.string().refine((value) => allowedMimeTypes.includes(value), {
        message: `Le type de fichier doit être l'un des suivants : ${allowedMimeTypes.join(", ")}`,
      }),
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
    });
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
  allowedMimeTypes: readonly string[];
  extensionsByMimeType?: Record<string, readonly string[]>;
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

export function buildSafeStorageFilename(
  validatedFile: ValidatedUploadFile,
): string {
  return `${crypto.randomUUID()}.${getFileExtension(validatedFile.originalname)}`;
}
