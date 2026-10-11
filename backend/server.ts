import express from "express";
import "./types/express";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth";
import homeRouter from "./routes/home";
import userRouter from "./routes/user";
import apartmentsRouter from "./routes/apartments";
import proSpacesRouter from "./routes/proSpaces";
import commonSpacesRouter from "./routes/commonSpaces";
import mediaRouter from "./routes/media";
import adminRouter from "./routes/admin/admin";
import { authMiddleware } from "./middleware/authMiddleware";
import { authorizeAdmin } from "./middleware/authorizationMiddleware";
import { errorHandler } from "./middleware/errorHandler";
import { initCronJobs } from "./cron";
import { browseLimiter, globalLimiter } from "./rateLimiting";

process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
});

// app setup
const app = express();
const PORT = 3000;
app.set("trust proxy", 1); // need to trust nginx (first proxy)
// logging middleware
app.use((req, _res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});
// middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
// limiter
app.use(globalLimiter);

// routes
// all routes are prefixed with /api
app.use("/auth", authRouter);
app.use("/home", browseLimiter, homeRouter);
app.use("/media", mediaRouter);
app.use("/apartments", browseLimiter, apartmentsRouter);
app.use("/pro-spaces", browseLimiter, proSpacesRouter);
app.use("/user", authMiddleware, browseLimiter, userRouter);
app.use("/common-spaces", authMiddleware, browseLimiter, commonSpacesRouter);
app.use("/admin", authMiddleware, authorizeAdmin(), adminRouter);

// custom error handler
app.use(errorHandler);

// launch
app.listen(PORT, () => {
  console.log(`API site live on http://localhost:${PORT}`);
  initCronJobs();
});
