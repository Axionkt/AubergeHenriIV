const SENSITIVE_KEYS = new Set([
  "token",
  "accessToken",
  "refreshToken",
  "password",
  "secret",
  "key",
]);

export function sanitizeLogData(
  obj: Record<string, unknown>,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [
      k,
      SENSITIVE_KEYS.has(k) ? "[REDACTED]" : v,
    ]),
  );
}
