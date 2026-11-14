import Router from "express";
import ReviewService from "../services/ReviewService";
import OverviewService from "../services/OverviewService";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.get(
  "/overview",
  asyncHandler(async (_req, res) => {
    const overview = await OverviewService.getOverview();
    res.status(200).json(overview);
  }),
);

router.get(
  "/reviews",
  asyncHandler(async (_req, res) => {
    const reviews = await ReviewService.getAllReviews();
    res.status(200).json(reviews);
  }),
);

export default router;
