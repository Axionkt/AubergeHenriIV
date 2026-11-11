import type { Pool } from "pg";
import { afterAll, beforeAll, vi } from "vitest";
import { applyTestEnv } from "./env";

applyTestEnv();

// No email ever leaves the test run. The mocks record each message, so
// tests can read the raw token out of the link, like a user would.
vi.mock("../emails/mailer", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../emails/mailer")>();
  return {
    ...actual,
    sendEmail: vi.fn(async () => {}),
    sendEmailBatch: vi.fn(async () => {}),
  };
});

// Each test file starts from empty tables (the schema is built once in
// globalSetup.ts).
let appPool: Pool;

beforeAll(async () => {
  // Kept for afterAll: a test may reset the module registry meanwhile.
  appPool = (await import("../db")).default;
  const { resetDatabase } = await import("./helpers");
  await resetDatabase();

  // Google ID token verification is replaced by a fake that accepts
  // "google:<email>" tokens, so no test talks to Google.
  const { default: AuthService } = await import("../services/AuthService");
  const { toGoogleProfile } = await import("../schemas/auth");
  const { UnauthorizedError } = await import(
    "../utils/errors/UnauthorizedError"
  );
  vi.spyOn(AuthService, "getGoogleProfile").mockImplementation(
    async (idToken) => {
      if (!idToken.startsWith("google:")) {
        throw new UnauthorizedError("Token Google invalide.");
      }
      return toGoogleProfile({ email: idToken.slice("google:".length) });
    },
  );
});

afterAll(async () => {
  await appPool.end();
});
