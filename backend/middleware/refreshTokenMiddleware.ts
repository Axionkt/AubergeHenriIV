import { Request, Response, NextFunction } from "express";
import { verifyRefreshToken } from "../utils/tokens";
import { UnauthorizedError } from "../utils/errors/UnauthorizedError";
import { BadRequestError } from "../utils/errors/BadRequestError";

export function refreshTokenMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  const token = req.cookies?.refreshToken;

  if (!token) {
    return next(new BadRequestError("Token de rafraîchissement manquant."));
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
