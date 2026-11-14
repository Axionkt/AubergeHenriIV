import { apartmentSchemas } from "../../schemas/apartment";
import { validateSetSpaceAvailabilityRequest } from "../../schemas/space";
import {
  validateUserApartmentAccessRequest,
  validateUserApartmentRevokeRequest,
} from "../../schemas/userAccess";
import { AdminApartmentService } from "../../services/admin/AdminSpaceService";
import type { UserApartmentAccessAdminDTO } from "../../types/userAccess";
import { createAdminSpaceRouter } from "../spaces/createAdminSpaceRouter";

export default createAdminSpaceRouter({
  kind: "apartment",
  service: AdminApartmentService,
  validateCreate: apartmentSchemas.validateCreate,
  validateUpdate: apartmentSchemas.validateUpdate,
  validateAvailability: validateSetSpaceAvailabilityRequest,
  validateGrant: validateUserApartmentAccessRequest,
  validateRevoke: validateUserApartmentRevokeRequest,
  toAccessAdminDTO: (a): UserApartmentAccessAdminDTO => ({
    userId: a.userId,
    firstName: a.firstName,
    lastName: a.lastName,
    apartmentId: a.spaceId,
    apartmentName: a.spaceName,
    accessExpiry: a.accessExpiry,
  }),
});
