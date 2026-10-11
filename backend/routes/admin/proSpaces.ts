import Router from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import AdminProSpaceServices from "../../services/admin/AdminProSpaceServices";
import {
  validateCreateProSpaceRequest,
  validateSetProSpaceAvailabilityRequest,
  validateUpdateProSpaceRequest,
} from "../../schemas/proSpace";
import { registerUuidParams } from "../../middleware/paramValidation";
import {
  validateUserProSpaceAccessRequest,
  validateUserProSpaceRevokeRequest,
} from "../../schemas/userAccess";
import { assertValid } from "../../utils/validation";

const router = Router();
registerUuidParams(router, ["uuid"]);

router.post(
  "/create",
  asyncHandler(async (req, res) => {
    const result = assertValid(validateCreateProSpaceRequest(req.body));

    const newUuid = await AdminProSpaceServices.createProSpace(result);

    res.status(201).json(newUuid);
  }),
);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const proSpaces = await AdminProSpaceServices.getAllProSpaces();
    res.status(200).json(proSpaces);
  }),
);

router
  .route("/user-accesses")
  .get(
    asyncHandler(async (req, res) => {
      const accesses = await AdminProSpaceServices.getAllUserAccesses();
      res.status(200).json(accesses);
    }),
  )
  .post(
    asyncHandler(async (req, res) => {
      const result = assertValid(validateUserProSpaceAccessRequest(req.body));

      await AdminProSpaceServices.giveUsersAccessToProSpace(result);
      res.sendStatus(204);
    }),
  )
  .delete(
    asyncHandler(async (req, res) => {
      const result = assertValid(validateUserProSpaceRevokeRequest(req.body));

      await AdminProSpaceServices.revokeUsersAccessFromProSpace(result);
      res.sendStatus(204);
    }),
  );

router.get(
  "/user-accesses/:uuid",
  asyncHandler(async (req, res) => {
    const members = await AdminProSpaceServices.getProSpaceUsers(
      req.params.uuid,
    );
    res.status(200).json(members);
  }),
);

router
  .route("/:uuid")
  .get(
    asyncHandler(async (req, res) => {
      const proSpace = await AdminProSpaceServices.getProSpaceById(
        req.params.uuid,
      );
      res.status(200).json(proSpace);
    }),
  )
  .put(
    asyncHandler(async (req, res) => {
      const result = assertValid(validateUpdateProSpaceRequest(req.body));

      await AdminProSpaceServices.updateProSpaceDetails(
        req.params.uuid,
        result,
      );

      res.sendStatus(204);
    }),
  )
  .delete(
    asyncHandler(async (req, res) => {
      await AdminProSpaceServices.deleteProSpace(req.params.uuid);
      res.sendStatus(204);
    }),
  );

router.put(
  "/:uuid/availability",
  asyncHandler(async (req, res) => {
    const { isAvailable, revokeAccesses } = assertValid(
      validateSetProSpaceAvailabilityRequest(req.body),
    );

    await AdminProSpaceServices.setAvailability(
      req.params.uuid,
      isAvailable,
      revokeAccesses,
    );

    res.sendStatus(204);
  }),
);

router.route("/:uuid/media").get(
  asyncHandler(async (req, res) => {
    const spaceMediaList = await AdminProSpaceServices.getProSpaceMediaById(
      req.params.uuid,
    );
    res.status(200).json(spaceMediaList);
  }),
);

export default router;
