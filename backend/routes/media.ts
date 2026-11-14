import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { mediaFetchLimiter } from "../middleware/rateLimiting";
import { optionalAuthenticationMiddleware } from "../middleware/authenticationMiddleware";
import { authorizeMedia } from "../middleware/authorizationMiddleware";
import { registerUuidParams } from "../middleware/paramValidation";

const router = Router();
registerUuidParams(router, ["uuid"]);

router.get(
  "/:uuid",
  mediaFetchLimiter,
  optionalAuthenticationMiddleware,
  authorizeMedia(),
  asyncHandler(async (req, res) => {
    const media = req.media!;

    res.set("Content-Type", media.mime_type);
    res.set("X-Accel-Redirect", `/internal/storage/${media.file_path}`);
    res.send();
  }),
);

export default router;
