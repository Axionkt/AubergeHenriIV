import express from "express";
import "./types/express";
import type { Server } from "node:http";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth";
import homeRouter from "./routes/home";
import userRouter from "./routes/user";
import apartmentsRouter from "./routes/apartments";
import proSpacesRouter from "./routes/proSpaces";
import mediaRouter from "./routes/media";
import adminRouter from "./routes/admin/admin";
import { authenticationMiddleware } from "./middleware/authenticationMiddleware";
import { authorizeAdmin } from "./middleware/authorizationMiddleware";
import { errorHandler } from "./middleware/errorHandler";
import { requestId } from "./middleware/requestId";
import { AppError } from "./utils/errors/AppError";
import { initCronJobs } from "./jobs/cron";
import { browseLimiter, globalLimiter } from "./middleware/rateLimiting";
import { ERROR_CODES } from "./utils/errors/errorCodes";
import { requestContextMiddleware } from "./middleware/requestContextMiddleware";
import { logError, logger } from "./utils/logger";
import pool from "./db";
import { runMigrations } from "./db/migrate";
import { normalizeError } from "./utils/errors/normalizeError";

// app setup
const app = express();
const PORT = 3000;
app.set("trust proxy", 1); // need to trust nginx (first proxy)
app.disable("x-powered-by");

// Docker health check: registered before logging and limiters so polling
// every few seconds neither fills the access log nor gets rate limited.
app.get("/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.status(200).json({ status: "ok" });
  } catch {
    res.status(503).json({ status: "db_unavailable" });
  }
});

// add id to track requests
app.use(requestId);

// logging
app.use((req, res, next) => {
  const start = Date.now();

  res.on("close", () => {
    const statusCode = res.statusCode;

    logger.info({
      requestId: req.id,
      userId: req.user?.sub ?? null,
      method: req.method,
      path: req.originalUrl.split("?")[0],
      route: req.baseUrl + (req.route?.path ?? ""),
      statusCode,
      aborted: !res.writableFinished,
      durationMs: Date.now() - start,
    });
  });

  next();
});

// limiter
app.use(globalLimiter);

// middleware
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());
app.use(requestContextMiddleware);

// routes - all routes are prefixed with /api
app.use("/auth", authRouter);
app.use("/home", browseLimiter, homeRouter);
app.use("/media", mediaRouter);
app.use("/apartments", browseLimiter, apartmentsRouter);
app.use("/pro-spaces", browseLimiter, proSpacesRouter);
app.use("/user", authenticationMiddleware, browseLimiter, userRouter);
app.use("/admin", authenticationMiddleware, authorizeAdmin(), adminRouter);

app.use((_req, _res, next) => {
  next(
    new AppError(
      404,
      ERROR_CODES.ROUTE_NOT_FOUND,
      "Ressource introuvable",
      undefined,
    ),
  );
});

// register custom error handler
app.use(errorHandler);

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
