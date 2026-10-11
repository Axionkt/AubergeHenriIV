import Router from "express";
import HomeServices from "../services/HomeServices";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.get(
  "/overview",
  asyncHandler(async (req, res) => {
    const overview = await HomeServices.getOverview();
    res.status(200).json(overview);
  }),
);

router.get(
  "/reviews",
  asyncHandler(async (req, res) => {
    const reviews = await HomeServices.getAllReviews();
    res.status(200).json(reviews);
  }),
);

export default router;
