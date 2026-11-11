import { proSpaceSchemas } from "../../schemas/proSpace";
import { validateSetSpaceAvailabilityRequest } from "../../schemas/space";
import {
  validateUserProSpaceAccessRequest,
  validateUserProSpaceRevokeRequest,
} from "../../schemas/userAccess";
import { AdminProSpaceService } from "../../services/admin/AdminSpaceService";
import type { UserProSpaceAccessAdminDTO } from "../../types/userAccess";
import { createAdminSpaceRouter } from "../spaces/createAdminSpaceRouter";

export default createAdminSpaceRouter({
  kind: "pro-space",
  service: AdminProSpaceService,
  validateCreate: proSpaceSchemas.validateCreate,
  validateUpdate: proSpaceSchemas.validateUpdate,
  validateAvailability: validateSetSpaceAvailabilityRequest,
  validateGrant: validateUserProSpaceAccessRequest,
  validateRevoke: validateUserProSpaceRevokeRequest,
  toAccessAdminDTO: (a): UserProSpaceAccessAdminDTO => ({
    userId: a.userId,
    firstName: a.firstName,
    lastName: a.lastName,
    proSpaceId: a.spaceId,
    proSpaceName: a.spaceName,
    accessExpiry: a.accessExpiry,
  }),
});
