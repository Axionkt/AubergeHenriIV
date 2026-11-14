import { Response } from "express";
import { config } from "../config";
import { generateAccessToken, generateRefreshToken } from "./tokens";

const base = {
  httpOnly: true,
  secure: config.NODE_ENV === "production",
  sameSite: "strict" as const,
};
const ACCESS = { ...base, path: "/" };
const REFRESH = { ...base, path: "/api/auth/refresh" };

/** Issues a fresh access/refresh token pair as httpOnly cookies. */
export function setAuthCookies(
  res: Response,
  user: { id: string; isAdmin: boolean; tokenVersion: number },
) {
  res.cookie("accessToken", generateAccessToken(user.id, user.isAdmin), {
    ...ACCESS,
    maxAge: 15 * 60_000,
  });
  res.cookie("refreshToken", generateRefreshToken(user.id, user.tokenVersion), {
    ...REFRESH,
    maxAge: 7 * 24 * 3_600_000,
  });
}

/**
 * Cookies are only cleared when the path matches the one they were set
 * with, hence the shared option objects above.
 */
export function clearAuthCookies(res: Response) {
  res.clearCookie("accessToken", ACCESS);
  res.clearCookie("refreshToken", REFRESH);
}
