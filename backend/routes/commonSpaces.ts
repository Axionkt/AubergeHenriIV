import Router from "express";
import { asyncHandler } from "../utils/asyncHandler";
import CommonSpaceServices from "../services/CommonSpaceServices";

const router = Router();

router.get(
  "/media",
  asyncHandler(async (req, res) => {
    const csMediaList = await CommonSpaceServices.getCommonSpaceMedia();
    res.status(200).json(csMediaList);
  }),
);

export default router;
