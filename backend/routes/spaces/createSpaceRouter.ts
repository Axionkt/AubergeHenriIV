import { Router } from "express";
import {
  authenticationMiddleware,
  optionalAuthenticationMiddleware,
} from "../../middleware/authenticationMiddleware";
import {
  authorizeCommonSpace,
  authorizeSpace,
  type SpaceAccess,
} from "../../middleware/authorizationMiddleware";
import { registerUuidParams } from "../../middleware/paramValidation";
import type { CommonSpaceMediaContext } from "../../schemas/media";
import type { SpaceAccessEntry } from "../../types/space";
import { asyncHandler } from "../../utils/asyncHandler";

interface PublicSpaceService {
  getAll(userId: string | null): Promise<unknown>;
  getForUser(userId: string): Promise<SpaceAccessEntry[]>;
  getById(id: string, userId: string): Promise<unknown>;
  getCommonSpaceMedia(): Promise<unknown>;
  getMediaById(id: string): Promise<unknown>;
}

interface Options<TAccessDTO> {
  service: PublicSpaceService;
  access: SpaceAccess;
  deniedMessage: string;
  commonMediaContext: CommonSpaceMediaContext;
  accessListPath: string;
  toAccessDTO: (entry: SpaceAccessEntry) => TAccessDTO;
}

export function createSpaceRouter<TAccessDTO>({
  service,
  access,
  deniedMessage,
  commonMediaContext,
  accessListPath,
  toAccessDTO,
}: Options<TAccessDTO>) {
  const router = Router();
  registerUuidParams(router, ["uuid"]);

  router.get(
    "/",
    optionalAuthenticationMiddleware,
    asyncHandler(async (req, res) => {
      const spaces = await service.getAll(req.user?.sub ?? null);
      res.status(200).json(spaces);
    }),
  );

  router.get(
    accessListPath,
    authenticationMiddleware,
    asyncHandler(async (req, res) => {
      const entries = await service.getForUser(req.user!.sub);
      res.status(200).json(entries.map(toAccessDTO));
    }),
  );

  router.get(
    "/:uuid",
    authenticationMiddleware,
    authorizeSpace(access, deniedMessage),
    asyncHandler(async (req, res) => {
      const space = await service.getById(req.params.uuid, req.user!.sub);
      res.status(200).json(space);
    }),
  );

  router.get(
    "/common-space/media",
    authenticationMiddleware,
    authorizeCommonSpace(commonMediaContext),
    asyncHandler(async (_req, res) => {
      res.status(200).json(await service.getCommonSpaceMedia());
    }),
  );

  router.get(
    "/:uuid/media",
    authenticationMiddleware,
    authorizeSpace(access, deniedMessage),
    asyncHandler(async (req, res) => {
      res.status(200).json(await service.getMediaById(req.params.uuid));
    }),
  );

  return router;
}
