import Router from "express";
import UserService from "../services/UserService";
import { asyncHandler } from "../utils/asyncHandler";
import { authorizeSelfOrAdmin } from "../middleware/authorizationMiddleware";
import { mutateAccountLimiter } from "../middleware/rateLimiting";
import { registerUuidParams } from "../middleware/paramValidation";
import { assertValid } from "../utils/validation";
import { validateEditUserDetailsRequest } from "../schemas/user";
import { audit } from "../utils/audit";

const router = Router();
registerUuidParams(router, ["uuid"]);

router
  .route("/:uuid")
  .get(
    authorizeSelfOrAdmin(),
    asyncHandler(async (req, res) => {
      const user = await UserService.getUserById(req.params.uuid);
      res.status(200).json(user);
    }),
  )
  .put(
    mutateAccountLimiter,
    authorizeSelfOrAdmin(),
    asyncHandler(async (req, res) => {
      const result = assertValid(validateEditUserDetailsRequest(req.body));

      await UserService.editUserDetails(req.params.uuid, result);
      res.sendStatus(204);
    }),
  )
  .delete(
    mutateAccountLimiter,
    authorizeSelfOrAdmin(),
    asyncHandler(async (req, res) => {
      await UserService.deleteUser(req.params.uuid);
      audit("user.delete", { targetType: "user", targetIds: [req.params.uuid] });
      res.sendStatus(204);
    }),
  );

export default router;
