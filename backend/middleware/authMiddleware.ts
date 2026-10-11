import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/password";
import { UnauthorizedError } from "../utils/errors/UnauthorizedError";

function resolveUser(req: Request): { sub: string; isAdmin: boolean } | null {
  const token = req.cookies?.accessToken;
  if (!token) return null;

  try {
    const payload = verifyAccessToken(token);
    return { sub: payload.sub, isAdmin: payload.isAdmin };
  } catch {
    return null;
  }
}

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const user = resolveUser(req);
  if (!user) {
    return next(
      new UnauthorizedError("Pas de token d'autorisation fourni ou invalide"),
    );
  }
  req.user = user;
  next();
}

export async function optionalAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  req.user = resolveUser(req) ?? undefined;
  next();
}
