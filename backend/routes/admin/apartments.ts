import Router from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import AdminApartmentServices from "../../services/admin/AdminApartmentServices";
import {
  validateCreateApartmentRequest,
  validateSetApartmentAvailabilityRequest,
  validateUpdateApartmentRequest,
} from "../../schemas/apartment";
import { registerUuidParams } from "../../middleware/paramValidation";
import {
  validateUserApartmentAccessRequest,
  validateUserApartmentRevokeRequest,
} from "../../schemas/userAccess";
import { assertValid } from "../../utils/validation";

const router = Router();
registerUuidParams(router, ["uuid"]);

router.post(
  "/create",
  asyncHandler(async (req, res) => {
    const result = assertValid(validateCreateApartmentRequest(req.body));

    const newUuid = await AdminApartmentServices.createApartment(result);

    res.status(201).json(newUuid);
  }),
);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const apartments = await AdminApartmentServices.getAllApartments();
    res.status(200).json(apartments);
  }),
);

router
  .route("/user-accesses")
  .get(
    asyncHandler(async (req, res) => {
      const accesses = await AdminApartmentServices.getAllUserAccesses();
      res.status(200).json(accesses);
    }),
  )
  .post(
    asyncHandler(async (req, res) => {
      const result = assertValid(validateUserApartmentAccessRequest(req.body));

      await AdminApartmentServices.giveUsersAccessToApartment(result);

      res.sendStatus(204);
    }),
  )
  .delete(
    asyncHandler(async (req, res) => {
      const result = assertValid(validateUserApartmentRevokeRequest(req.body));

      await AdminApartmentServices.revokeUsersAccessFromApartment(result);
      res.sendStatus(204);
    }),
  );

router.get(
  "/user-accesses/:uuid",
  asyncHandler(async (req, res) => {
    const members = await AdminApartmentServices.getApartmentUsers(
      req.params.uuid,
    );
    res.status(200).json(members);
  }),
);

router
  .route("/:uuid")
  .get(
    asyncHandler(async (req, res) => {
      const apartment = await AdminApartmentServices.getApartmentById(
        req.params.uuid,
      );
      res.status(200).json(apartment);
    }),
  )
  .put(
    asyncHandler(async (req, res) => {
      const result = assertValid(validateUpdateApartmentRequest(req.body));

      await AdminApartmentServices.updateApartmentDetails(
        req.params.uuid,
        result,
      );

      res.sendStatus(204);
    }),
  )
  .delete(
    asyncHandler(async (req, res) => {
      await AdminApartmentServices.deleteApartment(req.params.uuid);
      res.sendStatus(204);
    }),
  );

router.put(
  "/:uuid/availability",
  asyncHandler(async (req, res) => {
    const { isAvailable, revokeAccesses } = assertValid(
      validateSetApartmentAvailabilityRequest(req.body),
    );

    await AdminApartmentServices.setAvailability(
      req.params.uuid,
      isAvailable,
      revokeAccesses,
    );

    res.sendStatus(204);
  }),
);

router.route("/:uuid/media").get(
  asyncHandler(async (req, res) => {
    const aptMediaList = await AdminApartmentServices.getApartmentMediaById(
      req.params.uuid,
    );
    res.status(200).json(aptMediaList);
  }),
);

export default router;
