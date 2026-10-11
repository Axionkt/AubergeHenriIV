import Router from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import AdminUserServices from "../../services/admin/AdminUserServices";

const router = Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const users = await AdminUserServices.getAllUsers();
    res.status(200).json(users);
  }),
);

export default router;
