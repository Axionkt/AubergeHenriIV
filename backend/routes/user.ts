import Router from "express";
import UserServices from "../services/UserServices";
import { asyncHandler } from "../utils/asyncHandler";
import {
  authorizeUser,
  Permission,
} from "../middleware/authorizationMiddleware";
import { mutateAccountLimiter } from "../rateLimiting";
import { registerUuidParams } from "../middleware/paramValidation";
import { assertValid } from "../utils/validation";
import { validateEditUserDetailsRequest } from "../schemas/user";

const router = Router();
registerUuidParams(router, ["uuid"]);

router
  .route("/:uuid")
  .get(
    authorizeUser(Permission.READ),
    asyncHandler(async (req, res) => {
      const user = await UserServices.getUserById(req.params.uuid);
      res.status(200).json(user);
    }),
  )
  .put(
    mutateAccountLimiter,
    authorizeUser(Permission.WRITE),
    asyncHandler(async (req, res) => {
      const result = assertValid(validateEditUserDetailsRequest(req.body));

      await UserServices.editUserDetails(req.params.uuid, result);
      res.sendStatus(204);
    }),
  )
  .delete(
    mutateAccountLimiter,
    authorizeUser(Permission.WRITE),
    asyncHandler(async (req, res) => {
      await UserServices.deleteUser(req.params.uuid);
      res.sendStatus(204);
    }),
  );

export default router;
