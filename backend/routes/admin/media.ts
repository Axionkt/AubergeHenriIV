import { Router, Request, Response, NextFunction } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import AdminMediaService from "../../services/admin/AdminMediaService";
import {
  registerParam,
  registerUuidParams,
} from "../../middleware/paramValidation";
import {
  MediaContext,
  mediaContextParamSchema,
  singletonMediaRoleParamSchema,
  validateDeleteMediaRequest,
  validateReorderMediaRequest,
  validateUploadMediaFiles,
  validateUploadPlanFile,
  validateUploadThumbnailFile,
} from "../../schemas/media";
import { assertValid } from "../../utils/validation";
import { audit } from "../../utils/audit";
import {
  cleanupUploads,
  uploadMedia,
  uploadPlan,
  uploadThumbnail,
} from "../../utils/uploadStorage";

const SINGLETON_MEDIA_CONFIG = {
  thumbnail: {
    role: "THUMBNAIL",
    upload: uploadThumbnail.single("thumbnail"),
    validate: validateUploadThumbnailFile,
  },
  plan: {
    role: "PLAN",
    upload: uploadPlan.single("plan"),
    validate: validateUploadPlanFile,
  },
} as const;

function uploadSingleton(req: Request, res: Response, next: NextFunction) {
  const config =
    SINGLETON_MEDIA_CONFIG[
      req.params.role as keyof typeof SINGLETON_MEDIA_CONFIG
    ];

  config.upload(req, res, next);
}

const router = Router();
registerUuidParams(router, ["contextUuid"]);
registerParam(router, "context", mediaContextParamSchema);
registerParam(router, "role", singletonMediaRoleParamSchema);

router.post(
  "/:context{/:contextUuid}",
  cleanupUploads,
  uploadMedia.array("files"),
  asyncHandler<{ context: MediaContext; contextUuid?: string }>(
    async (req, res) => {
      const context = req.params.context;
      const contextUuid = req.params.contextUuid ?? null;
      await AdminMediaService.assertContextExists(context, contextUuid);
      const result = assertValid(await validateUploadMediaFiles(req.files));

      const inserted = await AdminMediaService.uploadResourceMediaFiles(
        context,
        contextUuid,
        result,
      );

      audit("media.upload", {
        targetType: context,
        targetIds: contextUuid ? [contextUuid] : [],
        mediaIds: inserted.map((m) => m.id),
      });
      res.status(201).json(inserted);
    },
  ),
);

router.delete(
  "/:context{/:contextUuid}",
  asyncHandler<{ context: MediaContext; contextUuid?: string }>(
    async (req, res) => {
      const context = req.params.context;
      const contextUuid = req.params.contextUuid ?? null;
      const result = assertValid(validateDeleteMediaRequest(req.body));
      await AdminMediaService.assertContextExists(context, contextUuid);

      await AdminMediaService.deleteResourceMediaFiles(context, contextUuid, {
        mediaIds: result.mediaIds,
      });

      audit("media.delete", {
        targetType: context,
        targetIds: contextUuid ? [contextUuid] : [],
        mediaIds: result.mediaIds,
      });
      res.sendStatus(204);
    },
  ),
);

router.put(
  "/:context{/:contextUuid}/reorder",
  asyncHandler<{ context: MediaContext; contextUuid?: string }>(
    async (req, res) => {
      const context = req.params.context;
      const contextUuid = req.params.contextUuid ?? null;
      const result = assertValid(validateReorderMediaRequest(req.body));
      await AdminMediaService.assertContextExists(context, contextUuid);

      await AdminMediaService.reorderResourceMediaFiles(
        context,
        contextUuid,
        result.mediaIds,
      );

      res.sendStatus(204);
    },
  ),
);

router.post(
  "/:context/:contextUuid/:role",
  cleanupUploads,
  uploadSingleton,
  asyncHandler<{
    context: MediaContext;
    contextUuid: string;
    role: keyof typeof SINGLETON_MEDIA_CONFIG;
  }>(async (req, res) => {
    const { context, contextUuid, role } = req.params;
    const config = SINGLETON_MEDIA_CONFIG[role];

    await AdminMediaService.assertContextExists(context, contextUuid, true);

    const validatedFile = assertValid(await config.validate(req.file));

    const result = await AdminMediaService.uploadResourceSingleton(
      context,
      contextUuid,
      config.role,
      validatedFile,
    );

    audit("media.upload", {
      targetType: context,
      targetIds: [contextUuid],
      role: config.role,
      mediaIds: [result.id],
    });
    res.status(201).json(result);
  }),
);

router.delete(
  "/:context/:contextUuid/:role",
  asyncHandler<{
    context: MediaContext;
    contextUuid: string;
    role: keyof typeof SINGLETON_MEDIA_CONFIG;
  }>(async (req, res) => {
    const { context, contextUuid, role } = req.params;
    const config = SINGLETON_MEDIA_CONFIG[role];

    await AdminMediaService.assertContextExists(context, contextUuid, true);

    await AdminMediaService.deleteResourceMediaFiles(context, contextUuid, {
      roles: [config.role],
    });

    audit("media.delete", {
      targetType: context,
      targetIds: [contextUuid],
      role: config.role,
    });
    res.sendStatus(204);
  }),
);

export default router;
