/**
 * Environment for the app under test. config.ts validates process.env when
 * it is first imported, so this must run before any app module loads.
 * Database settings can be overridden from the shell or CI.
 */
export function applyTestEnv(): void {
  const env = process.env;

  env.NODE_ENV = "development";
  env.LOG_LEVEL ??= "silent";

  env.DB_HOST ??= "localhost";
  env.DB_PORT ??= "5433";
  env.DB_USER ??= "postgres";
  env.DB_PASSWORD ??= "postgres";
  env.DB_NAME ??= "auberge_test";

  env.FRONTEND_URL = "http://localhost:5173";
  env.JWT_ACCESS_SECRET = "test-access-secret-at-least-32-characters-long";
  env.JWT_REFRESH_SECRET = "test-refresh-secret-at-least-32-characters-long";
  env.GOOGLE_CLIENT_ID = "test-google-client-id";
  env.RESEND_API_KEY = "re_test_not_a_real_key";
  env.STORAGE_ROOT = "/tmp/auberge-test-storage";
}

/** The reset drops the whole schema, so only ever point it at a test database. */
export function assertTestDatabase(): void {
  const name = process.env.DB_NAME ?? "";
  if (!/test/i.test(name)) {
    throw new Error(
      `Refusing to reset database "${name}": DB_NAME must contain "test".`,
    );
  }
}
