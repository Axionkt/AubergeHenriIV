import Router from "express";
import { asyncHandler } from "../utils/asyncHandler";
import ProSpaceServices from "../services/ProSpaceServices";
import {
  authorizeProSpace,
  Permission,
} from "../middleware/authorizationMiddleware";
import {
  authMiddleware,
  optionalAuthMiddleware,
} from "../middleware/authMiddleware";
import { registerUuidParams } from "../middleware/paramValidation";

const router = Router();
registerUuidParams(router, ["uuid"]);

router.get(
  "/",
  optionalAuthMiddleware,
  asyncHandler(async (req, res) => {
    const userId = req.user?.sub ?? null;

    const proSpaces = await ProSpaceServices.getAllProSpaces(userId);
    res.status(200).json(proSpaces);
  }),
);

router.get(
  "/access-to-pro-spaces",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const userId = req.user!.sub;

    const proSpaces = await ProSpaceServices.getProSpacesForUser(userId);
    res.status(200).json(proSpaces);
  }),
);

router.get(
  "/:uuid",
  authMiddleware,
  authorizeProSpace(Permission.READ),
  asyncHandler(async (req, res) => {
    const proSpace = await ProSpaceServices.getProSpaceById(
      req.params.uuid,
      req.user!.sub,
    );
    res.status(200).json(proSpace);
  }),
);

router.get(
  "/:uuid/media",
  authMiddleware,
  authorizeProSpace(Permission.READ),
  asyncHandler(async (req, res) => {
    const spaceMediaList = await ProSpaceServices.getProSpaceMediaById(
      req.params.uuid,
    );
    res.status(200).json(spaceMediaList);
  }),
);

export default router;
