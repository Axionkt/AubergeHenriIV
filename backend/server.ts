import type { Server } from "node:http";
import app from "./app";
import pool from "./db";
import { runMigrations } from "./db/migrate";
import { initCronJobs } from "./jobs/cron";
import { normalizeError } from "./utils/errors/normalizeError";
import { logError, logger } from "./utils/logger";

const PORT = 3000;

// launch
let server: Server | undefined;
runMigrations()
  .then(() => {
    server = app.listen(PORT, () => {
      logger.info(`API site live on http://localhost:${PORT}`);
      initCronJobs();
    });
  })
  .catch((err) => {
    logError(err, { forceServerError: true, operation: "migrations" });
    process.exit(1);
  });

// graceful shutdown: let in-flight requests finish when Docker redeploys
async function shutdown(signal: string, code = 0) {
  logger.info(signal + " received");
  setTimeout(() => process.exit(1), 10_000).unref();

  if (!server) {
    await pool.end().catch(() => {});
    process.exit(code);
  }

  server.close(async () => {
    await pool.end();
    process.exit(code);
  });
  server.closeIdleConnections();
}

// Normal stops (Docker redeploy, Ctrl+C): exit code 0
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// Crashes: log, then drain requests and exit with code 1
process.on("uncaughtException", (e) => {
  logError(normalizeError(e), {
    forceServerError: true,
    operation: "uncaughtException",
  });
  shutdown("uncaughtException", 1);
});
process.on("unhandledRejection", (e) => {
  logError(normalizeError(e), {
    forceServerError: true,
    operation: "unhandledRejection",
  });
  shutdown("unhandledRejection", 1);
});
