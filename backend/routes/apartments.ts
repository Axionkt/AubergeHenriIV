import { ApartmentAccessService } from "../services/spaces/SpaceAccessService";
import { ApartmentService } from "../services/spaces/SpaceService";
import type { UserApartmentAccessDTO } from "../types/userAccess";
import { createSpaceRouter } from "./spaces/createSpaceRouter";

export default createSpaceRouter({
  service: ApartmentService,
  access: ApartmentAccessService,
  deniedMessage: "Accès à cet appartement refusé.",
  commonMediaContext: "apartment-common",
  accessListPath: "/access-to-apartments",
  toAccessDTO: (entry): UserApartmentAccessDTO => ({
    apartmentId: entry.id,
    apartmentName: entry.name,
    apartmentThumbnailUrl: entry.thumbnailUrl,
    accessExpiry: entry.accessExpiry,
  }),
});
