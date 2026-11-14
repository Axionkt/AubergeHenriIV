import { ProSpaceAccessService } from "../services/spaces/SpaceAccessService";
import { ProSpaceService } from "../services/spaces/SpaceService";
import type { UserProSpaceAccessDTO } from "../types/userAccess";
import { createSpaceRouter } from "./spaces/createSpaceRouter";

export default createSpaceRouter({
  service: ProSpaceService,
  access: ProSpaceAccessService,
  deniedMessage: "Accès à cet espace professionnel refusé.",
  commonMediaContext: "pro-space-common",
  accessListPath: "/access-to-pro-spaces",
  toAccessDTO: (entry): UserProSpaceAccessDTO => ({
    proSpaceId: entry.id,
    proSpaceName: entry.name,
    proSpaceThumbnailUrl: entry.thumbnailUrl,
    accessExpiry: entry.accessExpiry,
  }),
});
