import Router from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import AdminHomeServices from "../../services/admin/AdminHomeServices";
import { registerIdParams } from "../../middleware/paramValidation";
import {
  validateCreateReviewRequest,
  validateUpdateReviewRequest,
} from "../../schemas/review";
import { assertValid } from "../../utils/validation";

const router = Router();
registerIdParams(router, ["id"]);

router.post(
  "/reviews",
  asyncHandler(async (req, res) => {
    const { authorName, text, createdAt } = assertValid(
      validateCreateReviewRequest(req.body),
    );

    await AdminHomeServices.createReview({ authorName, text, createdAt });
    res.sendStatus(201);
  }),
);

router
  .route("/reviews/:id")
  .put(
    asyncHandler(async (req, res) => {
      const id = Number(req.params.id);
      const updates = assertValid(validateUpdateReviewRequest(req.body));

      await AdminHomeServices.updateReview(id, updates);
      res.sendStatus(204);
    }),
  )
  .delete(
    asyncHandler(async (req, res) => {
      const id = Number(req.params.id);

      await AdminHomeServices.deleteReview(id);
      res.sendStatus(204);
    }),
  );

export default router;
