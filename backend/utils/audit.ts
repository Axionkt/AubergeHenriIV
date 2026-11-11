import { getRequestContext } from "../context/requestContext";
import { logger } from "./logger";

/**
 * Admin actions worth a permanent record of who did what. These go to the
 * log stream (event "admin_audit") so they survive with the rest of the
 * logs; keep the retention in docker-compose long enough to cover disputes.
 */
export type AuditAction =
  | "access.grant"
  | "access.revoke"
  | "space.create"
  | "space.update"
  | "space.delete"
  | "space.availability"
  | "user.delete"
  | "media.upload"
  | "media.delete"
  | "review.create"
  | "review.update"
  | "review.delete";

export interface AuditDetails {
  /** Kind of target: "apartment", "pro-space", "user", "media", "review". */
  targetType?: string;
  targetIds?: (string | number)[];
  userIds?: string[];
  [key: string]: unknown;
}

/** Ids only, never names, emails or free text, to keep personal data out. */
export function audit(action: AuditAction, details: AuditDetails = {}): void {
  const context = getRequestContext();

  logger.info({
    event: "admin_audit",
    action,
    actorId: context?.userId ?? null,
    requestId: context?.requestId ?? null,
    ...details,
  });
}
