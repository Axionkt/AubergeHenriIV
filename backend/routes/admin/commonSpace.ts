import Router from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import AdminCommonSpaceServices from "../../services/admin/AdminCommonSpaceServices";

const router = Router();

router.route("/media").get(
  asyncHandler(async (req, res) => {
    const commonSpaceMediaList =
      await AdminCommonSpaceServices.getCommonSpaceMedia();
    res.status(200).json(commonSpaceMediaList);
  }),
);

export default router;
