import express from "express";
import "./types/express";
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
import { browseLimiter, globalLimiter } from "./middleware/rateLimiting";
import { ERROR_CODES } from "./utils/errors/errorCodes";
import { requestContextMiddleware } from "./middleware/requestContextMiddleware";
import { logger } from "./utils/logger";
import pool from "./db";

// app setup
const app = express();
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

export default app;
