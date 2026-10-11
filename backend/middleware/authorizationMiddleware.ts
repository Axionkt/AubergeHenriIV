import { UnauthorizedError } from "../utils/errors/UnauthorizedError";
import { asyncHandler } from "../utils/asyncHandler";
import ApartmentAccessServices from "../services/ApartmentAccessServices";
import UserAccessServices from "../services/UserAccessServices";
import ProSpaceAccessServices from "../services/ProSpaceAccessServices";

export enum Permission {
  READ = "read",
  WRITE = "write",
}

export function authorizeAdmin() {
  return asyncHandler(async (req, res, next) => {
    const user = req.user!;
    if (!user.isAdmin) {
      throw new UnauthorizedError("Accès administrateur requis.");
    }
    next();
  });
}

export function authorizeUser(permission: Permission) {
  return asyncHandler(async (req, res, next) => {
    const user = req.user!;

    let hasAccess: boolean;
    switch (permission) {
      case Permission.READ:
        hasAccess = await UserAccessServices.canRead(
          user.sub,
          req.params.uuid,
          user.isAdmin,
        );
        break;
      case Permission.WRITE:
        hasAccess = await UserAccessServices.canWrite(
          user.sub,
          req.params.uuid,
          user.isAdmin,
        );
        break;
      default:
        throw new UnauthorizedError("Permission non valide.");
    }

    if (!hasAccess) {
      throw new UnauthorizedError("Accès à cet utilisateur refusé.");
    }

    next();
  });
}

export function authorizeApartment(permission: Permission) {
  return asyncHandler(async (req, res, next) => {
    const user = req.user!;

    let hasAccess: boolean;
    switch (permission) {
      case Permission.READ:
        hasAccess = await ApartmentAccessServices.canRead(
          user.sub,
          req.params.uuid,
          user.isAdmin,
        );
        break;
      case Permission.WRITE:
        hasAccess = await ApartmentAccessServices.canWrite(user.isAdmin);
        break;
      default:
        throw new UnauthorizedError("Permission non valide.");
    }

    if (!hasAccess) {
      throw new UnauthorizedError("Accès à cet appartement refusé.");
    }

    next();
  });
}

export function authorizeProSpace(permission: Permission) {
  return asyncHandler(async (req, res, next) => {
    const user = req.user!;

    let hasAccess: boolean;
    switch (permission) {
      case Permission.READ:
        hasAccess = await ProSpaceAccessServices.canRead(
          user.sub,
          req.params.uuid,
          user.isAdmin,
        );
        break;
      case Permission.WRITE:
        hasAccess = await ProSpaceAccessServices.canWrite(user.isAdmin);
        break;
      default:
        throw new UnauthorizedError("Permission non valide.");
    }

    if (!hasAccess) {
      throw new UnauthorizedError("Accès à cet espace professionnel refusé.");
    }

    next();
  });
}
