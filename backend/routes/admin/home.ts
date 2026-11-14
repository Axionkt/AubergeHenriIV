import Router from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import AdminReviewService from "../../services/admin/AdminReviewService";
import { registerIdParams } from "../../middleware/paramValidation";
import {
  validateCreateReviewRequest,
  validateUpdateReviewRequest,
} from "../../schemas/review";
import { assertValid } from "../../utils/validation";
import { audit } from "../../utils/audit";

const router = Router();
registerIdParams(router, ["id"]);

router.post(
  "/reviews",
  asyncHandler(async (req, res) => {
    const { authorName, text, createdAt } = assertValid(
      validateCreateReviewRequest(req.body),
    );

    const ret = await AdminReviewService.createReview({
      authorName,
      text,
      createdAt,
    });
    audit("review.create", { targetType: "review", targetIds: [ret.id] });
    res.status(201).json(ret);
  }),
);

router
  .route("/reviews/:id")
  .put(
    asyncHandler(async (req, res) => {
      const id = Number(req.params.id);
      const updates = assertValid(validateUpdateReviewRequest(req.body));

      const ret = await AdminReviewService.updateReview(id, updates);
      audit("review.update", { targetType: "review", targetIds: [id] });
      res.status(200).json(ret);
    }),
  )
  .delete(
    asyncHandler(async (req, res) => {
      const id = Number(req.params.id);

      await AdminReviewService.deleteReview(id);
      audit("review.delete", { targetType: "review", targetIds: [id] });
      res.sendStatus(204);
    }),
  );

export default router;
