import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;
const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

if (!ACCESS_SECRET) {
  throw new Error("ACCESS_SECRET is not defined");
}
if (!REFRESH_SECRET) {
  throw new Error("REFRESH_SECRET is not defined");
}

export interface AccessTokenPayload {
  sub: string;
  isAdmin: boolean;
}
export interface RefreshTokenPayload {
  sub: string;
}

export function generateAccessToken(userId: string, isAdmin: boolean): string {
  return jwt.sign({ sub: userId, isAdmin }, ACCESS_SECRET, {
    expiresIn: "15m",
  });
}

export function generateRefreshToken(userId: string): string {
  return jwt.sign({ sub: userId }, REFRESH_SECRET, { expiresIn: "7d" });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, ACCESS_SECRET) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, REFRESH_SECRET) as RefreshTokenPayload;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(
  password: string,
  hashedPassword: string,
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}
