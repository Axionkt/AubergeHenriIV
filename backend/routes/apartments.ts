import Router from "express";
import { asyncHandler } from "../utils/asyncHandler";
import ApartmentServices from "../services/ApartmentServices";
import {
  authorizeApartment,
  Permission,
} from "../middleware/authorizationMiddleware";
import {
  authMiddleware,
  optionalAuthMiddleware,
} from "../middleware/authMiddleware";
import { registerUuidParams } from "../middleware/paramValidation";

const router = Router();
registerUuidParams(router, ["uuid"]);

router.get(
  "/",
  optionalAuthMiddleware,
  asyncHandler(async (req, res) => {
    const userId = req.user?.sub ?? null;

    const apartments = await ApartmentServices.getAllApartments(userId);
    res.status(200).json(apartments);
  }),
);

router.get(
  "/access-to-apartments",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const userId = req.user!.sub;

    const apartments = await ApartmentServices.getApartmentsForUser(userId);
    res.status(200).json(apartments);
  }),
);

router.get(
  "/:uuid",
  authMiddleware,
  authorizeApartment(Permission.READ),
  asyncHandler(async (req, res) => {
    const apartment = await ApartmentServices.getApartmentById(
      req.params.uuid,
      req.user!.sub,
    );
    res.status(200).json(apartment);
  }),
);

router.get(
  "/:uuid/media",
  authMiddleware,
  authorizeApartment(Permission.READ),
  asyncHandler(async (req, res) => {
    const aptMediaList = await ApartmentServices.getApartmentMediaById(
      req.params.uuid,
    );
    res.status(200).json(aptMediaList);
  }),
);

export default router;
