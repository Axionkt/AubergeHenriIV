import Router from "express";
import adminUserRouter from "./user";
import adminHomeRouter from "./home";
import adminApartmentsRouter from "./apartments";
import adminProSpacesRouter from "./proSpaces";
import adminCommonSpacesRouter from "./commonSpace";
import adminMediaRouter from "./media";
import { adminMediaMutationLimiter } from "../../rateLimiting";

const router = Router();

router.use("/users", adminUserRouter);
router.use("/home", adminHomeRouter);
router.use("/apartments", adminApartmentsRouter);
router.use("/pro-spaces", adminProSpacesRouter);
router.use("/common-spaces", adminCommonSpacesRouter);
router.use("/media", adminMediaMutationLimiter, adminMediaRouter);

export default router;
