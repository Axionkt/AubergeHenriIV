import { ForbiddenError } from "../utils/errors/ForbiddenError";
import { UnauthorizedError } from "../utils/errors/UnauthorizedError";
import { asyncHandler } from "../utils/asyncHandler";
import type { CommonSpaceMediaContext, MediaContext } from "../schemas/media";
import MediaService from "../services/MediaService";
import {
  ApartmentAccessService,
  ProSpaceAccessService,
} from "../services/spaces/SpaceAccessService";

export interface SpaceAccess {
  hasAnyAccess(userId: string, isAdmin?: boolean): Promise<boolean>;
  hasAccessTo(
    userId: string,
    spaceId: string,
    isAdmin?: boolean,
  ): Promise<boolean>;
}

// Which access rules govern each media context.
const ACCESS_BY_CONTEXT = {
  apartment: ApartmentAccessService,
  "apartment-common": ApartmentAccessService,
  "pro-space": ProSpaceAccessService,
  "pro-space-common": ProSpaceAccessService,
} satisfies Record<MediaContext, SpaceAccess>;

export function authorizeAdmin() {
  return asyncHandler(async (req, _res, next) => {
    if (!req.user!.isAdmin) {
      throw new ForbiddenError("Accès administrateur requis.");
    }
    next();
  });
}

/** Routes with a :uuid user param: only that user, or an admin. */
export function authorizeSelfOrAdmin() {
  return asyncHandler(async (req, _res, next) => {
    const user = req.user!;

    if (!user.isAdmin && user.sub !== req.params.uuid) {
      throw new ForbiddenError("Accès à cet utilisateur refusé.");
    }
    next();
  });
}

/** Routes with a :uuid apartment/pro-space param. */
export function authorizeSpace(access: SpaceAccess, deniedMessage: string) {
  return asyncHandler(async (req, _res, next) => {
    const user = req.user!;

    if (!(await access.hasAccessTo(user.sub, req.params.uuid, user.isAdmin))) {
      throw new ForbiddenError(deniedMessage);
    }
    next();
  });
}

export function authorizeCommonSpace(context: CommonSpaceMediaContext) {
  return asyncHandler(async (req, _res, next) => {
    const user = req.user!;

    if (
      !(await ACCESS_BY_CONTEXT[context].hasAnyAccess(user.sub, user.isAdmin))
    ) {
      throw new ForbiddenError("Accès à cet espace commun refusé.");
    }
    next();
  });
}

/**
 * GET /media/:uuid. Loads the media row once, applies the access rules, and
 * hands the row to the handler as req.media. Requires
 * optionalAuthenticationMiddleware before it.
 */
export function authorizeMedia() {
  return asyncHandler(async (req, _res, next) => {
    const media = await MediaService.getMedia(req.params.uuid);
    req.media = media;

    // Thumbnails are public, even for restricted spaces.
    if (media.role === "THUMBNAIL") {
      next();
      return;
    }

    if (!req.user) {
      throw new UnauthorizedError(
        "Vous devez être connecté pour accéder à ce média.",
      );
    }

    const { sub, isAdmin } = req.user;
    const access = ACCESS_BY_CONTEXT[media.context];

    // The media_context_id_chk constraint guarantees context_id is NULL
    // exactly for the *-common contexts.
    const hasAccess =
      media.context_id === null
        ? await access.hasAnyAccess(sub, isAdmin)
        : await access.hasAccessTo(sub, media.context_id, isAdmin);

    if (!hasAccess) {
      throw new ForbiddenError("Accès refusé.");
    }
    next();
  });
}
