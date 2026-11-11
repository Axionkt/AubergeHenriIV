import crypto from "node:crypto";

/**
 * SHA-256 of an emailed token. Tokens are 32 random bytes, so a fast
 * unsalted hash is enough: there is nothing to brute-force.
 */
export const hashToken = (token: string): string => {
  return crypto.createHash("sha256").update(token).digest("hex");
};
