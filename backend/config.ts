import { z } from "zod";
import { logger } from "./utils/logger";

const schema = z.object({
  NODE_ENV: z.enum(["development", "production"]),
  FRONTEND_URL: z.string().min(1),
  DB_HOST: z.string(),
  DB_PORT: z.coerce.number(),
  DB_USER: z.string(),
  DB_PASSWORD: z.string().min(1),
  DB_NAME: z.string(),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  RESEND_API_KEY: z.string().min(1),
  STORAGE_ROOT: z.string().min(1),
  UPLOAD_TMP_DIR: z.string().optional(),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  logger.fatal(
    {
      event: "invalid_environment",
      errors: parsed.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    },
    "Invalid environment configuration",
  );

  process.exit(1);
}

export const config = parsed.data;
