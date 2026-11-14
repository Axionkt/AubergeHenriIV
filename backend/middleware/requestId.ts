import { randomUUID } from "node:crypto";
import { Request, Response, NextFunction } from "express";

/**
 * Assigns a fresh ID to every request and exposes it as an X-Request-Id
 * response header, so a user's report can be matched to a log line.
 */
export function requestId(req: Request, res: Response, next: NextFunction) {
  req.id = randomUUID();
  res.setHeader("X-Request-Id", req.id);
  next();
}
