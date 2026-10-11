import { Router } from "express";
import multer from "multer";
import { asyncHandler } from "../../utils/asyncHandler";
import AdminMediaServices from "../../services/admin/AdminMediaServices";
import {
  registerParam,
  registerUuidParams,
} from "../../middleware/paramValidation";
import {
  MediaContext,
  mediaContextParamSchema,
  validateReorderMediaRequest,
  validateUploadMediaFiles,
  validateUploadThumbnailFile,
} from "../../schemas/media";
import { assertValid } from "../../utils/validation";
import {
  MAX_MEDIA_AT_ONCE,
  MAX_MEDIA_SIZE_BYTES,
  MAX_THUMBNAIL_SIZE_BYTES,
} from "../../schemas/shared/fileUpload";

const router = Router();
registerUuidParams(router, ["contextUuid"]);
registerParam(router, "context", mediaContextParamSchema);

const uploadMedia = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_MEDIA_SIZE_BYTES,
    files: MAX_MEDIA_AT_ONCE,
  },
});

const uploadThumb = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_THUMBNAIL_SIZE_BYTES,
    files: 1,
  },
});

router.post(
  "/:context{/:contextUuid}",
  uploadMedia.array("files"),
  asyncHandler<{ context: MediaContext; contextUuid?: string }>(
    async (req, res) => {
      const context = req.params.context;
      const contextUuid = req.params.contextUuid;

      await AdminMediaServices.assertContextExists(context, contextUuid);
      const result = assertValid(await validateUploadMediaFiles(req.files));
      const inserted = await AdminMediaServices.uploadMediaFiles(
        result,
        context,
        contextUuid,
      );

      res.status(201).json(inserted);
    },
  ),
);

router.put(
  "/:context{/:contextUuid}/reorder",
  asyncHandler<{ context: MediaContext; contextUuid?: string }>(
    async (req, res) => {
      const context = req.params.context;
      const contextUuid = req.params.contextUuid;
      const result = assertValid(validateReorderMediaRequest(req.body));

      await AdminMediaServices.assertContextExists(context, contextUuid);
      await AdminMediaServices.reorderMediaFiles(
        result.mediaIds,
        context,
        contextUuid,
      );

      res.sendStatus(204);
    },
  ),
);

router.delete(
  "/:context{/:contextUuid}",
  asyncHandler<{ context: MediaContext; contextUuid?: string }>(
    async (req, res) => {
      const context = req.params.context;
      const contextUuid = req.params.contextUuid;
      const result = assertValid(validateReorderMediaRequest(req.body));

      await AdminMediaServices.assertContextExists(context, contextUuid);
      await AdminMediaServices.deleteMediaFiles(
        result.mediaIds,
        context,
        contextUuid,
      );

      res.sendStatus(204);
    },
  ),
);

router.post(
  "/:context/:contextUuid/thumbnail",
  uploadThumb.single("thumbnail"),
  asyncHandler<{ context: MediaContext; contextUuid: string }>(
    async (req, res) => {
      const context = req.params.context;
      const contextUuid = req.params.contextUuid;

      await AdminMediaServices.assertContextExists(context, contextUuid, true);
      const resultThumbnail = assertValid(
        await validateUploadThumbnailFile(req.file),
      );

      const result = await AdminMediaServices.uploadThumbnail(
        resultThumbnail,
        context,
        contextUuid,
      );

      res.status(201).json(result);
    },
  ),
);

router.delete(
  "/:context/:contextUuid/thumbnail",
  asyncHandler<{ context: MediaContext; contextUuid: string }>(
    async (req, res) => {
      const context = req.params.context;
      const contextUuid = req.params.contextUuid;

      await AdminMediaServices.assertContextExists(context, contextUuid, true);
      await AdminMediaServices.deleteThumbnail(context, contextUuid);

      res.sendStatus(204);
    },
  ),
);

export default router;
