import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/tokens";
import { UnauthorizedError } from "../utils/errors/UnauthorizedError";
import { setRequestUser } from "../context/requestContext";

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

export function authenticationMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  const user = resolveUser(req);
  if (!user) {
    return next(
      new UnauthorizedError("Token d'authentification manquant ou invalide."),
    );
  }
  req.user = user;

  // important for logging user info when in an authenticated route
  setRequestUser(user.sub);

  next();
}

export function optionalAuthenticationMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  const user = resolveUser(req);

  req.user = user ?? undefined;

  // important for logging user info when available in an optionally authenticated route
  setRequestUser(user?.sub ?? null);

  next();
}
