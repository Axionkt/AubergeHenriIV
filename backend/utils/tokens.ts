import jwt from "jsonwebtoken";
import { config } from "../config";

// Presence and length are already enforced by config.ts.
const ACCESS_SECRET = config.JWT_ACCESS_SECRET;
const REFRESH_SECRET = config.JWT_REFRESH_SECRET;

export interface AccessTokenPayload {
  sub: string;
  isAdmin: boolean;
}
export interface RefreshTokenPayload {
  sub: string;
  v: number;
}

export function generateAccessToken(userId: string, isAdmin: boolean): string {
  return jwt.sign({ sub: userId, isAdmin }, ACCESS_SECRET, {
    algorithm: "HS256",
    expiresIn: "15m",
  });
}

export function generateRefreshToken(
  userId: string,
  tokenVersion: number,
): string {
  return jwt.sign(
    {
      sub: userId,
      v: tokenVersion,
    },
    REFRESH_SECRET,
    {
      algorithm: "HS256",
      expiresIn: "7d",
    },
  );
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const payload = jwt.verify(token, ACCESS_SECRET, {
    algorithms: ["HS256"],
  });

  if (
    typeof payload === "string" ||
    typeof payload.sub !== "string" ||
    typeof payload.isAdmin !== "boolean"
  ) {
    throw new jwt.JsonWebTokenError("Invalid access token payload");
  }

  return {
    sub: payload.sub,
    isAdmin: payload.isAdmin,
  };
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const payload = jwt.verify(token, REFRESH_SECRET, {
    algorithms: ["HS256"],
  });

  if (
    typeof payload === "string" ||
    typeof payload.sub !== "string" ||
    !Number.isSafeInteger(payload.v) ||
    (payload.v as number) < 0
  ) {
    throw new jwt.JsonWebTokenError("Invalid refresh token payload");
  }

  return {
    sub: payload.sub,
    v: payload.v as number,
  };
}
