import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import MediaServices from "../services/MediaServices";
import { mediaFetchLimiter } from "../rateLimiting";
import { optionalAuthMiddleware } from "../middleware/authMiddleware";
import { registerUuidParams } from "../middleware/paramValidation";

const router = Router();
registerUuidParams(router, ["uuid"]);

router.get(
  "/:uuid",
  mediaFetchLimiter,
  optionalAuthMiddleware,
  asyncHandler<{ uuid: string }>(async (req, res) => {
    const mediaId = req.params.uuid;
    const user = req.user
      ? { sub: req.user.sub, isAdmin: req.user.isAdmin }
      : null;

    const media = await MediaServices.getMediaItem(mediaId, user);

    res.set("Content-Type", media.mimeType);
    res.set("X-Accel-Redirect", `/internal/storage/${media.filePath}`);
    res.send();
  }),
);

export default router;
