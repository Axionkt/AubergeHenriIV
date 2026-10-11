import { Request, Response, NextFunction } from "express";
import { verifyRefreshToken } from "../utils/password";
import { UnauthorizedError } from "../utils/errors/UnauthorizedError";

export async function refreshTokenMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const token = req.cookies?.refreshToken;

  if (!token) {
    return next(new UnauthorizedError("Token de rafraîchissement manquant."));
  }

  try {
    req.decodedRefreshToken = verifyRefreshToken(token);
    next();
  } catch {
    next(
      new UnauthorizedError("Token de rafraîchissement invalide ou expiré."),
    );
  }
}
