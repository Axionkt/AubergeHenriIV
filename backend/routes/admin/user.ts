import Router from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import AdminUserService from "../../services/admin/AdminUserService";

const router = Router();

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const users = await AdminUserService.getAllUsers();
    res.status(200).json(users);
  }),
);

export default router;
