import path from "path";
import { BadRequestError } from "./errors/BadRequestError";
import { UnauthorizedError } from "./errors/UnauthorizedError";
import ApartmentAccessServices from "../services/ApartmentAccessServices";
import CommonSpaceAccessServices from "../services/CommonSpaceAccessServices";
import ProSpaceAccessServices from "../services/ProSpaceAccessServices";
import { MediaContext } from "../schemas/media";

// Storage path resolution with directory traversal protection
const STORAGE_ROOT = process.env.STORAGE_ROOT!;

export function resolveSafePath(unsafePath: string) {
  const resolved = path.resolve(STORAGE_ROOT, unsafePath);
  const rootResolved = path.resolve(STORAGE_ROOT);
  if (path.relative(rootResolved, resolved).startsWith("..")) {
    throw new BadRequestError("Résolution de chemin invalide.");
  }
  return resolved;
}

export async function checkMediaAccess(
  context: MediaContext,
  contextId: string | null,
  userId: string,
  isAdmin: boolean = false,
): Promise<void> {
  let hasAccess: boolean;

  switch (context) {
    case "apartment":
      hasAccess = contextId
        ? await ApartmentAccessServices.canRead(userId, contextId, isAdmin)
        : false;
      break;
    case "pro-space":
      hasAccess = contextId
        ? await ProSpaceAccessServices.canRead(userId, contextId, isAdmin)
        : false;
      break;
    case "common-space":
      hasAccess = await CommonSpaceAccessServices.canRead(userId, isAdmin);
      break;
    default:
      throw new BadRequestError("Contexte média inconnu.");
  }

  if (!hasAccess) {
    throw new UnauthorizedError("Accès refusé.");
  }
}
