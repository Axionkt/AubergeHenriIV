import { OverviewDTO } from "../types/overview";
import { ApartmentService, ProSpaceService } from "./spaces/SpaceService";

/** Public counts shown on the home page. */
export default class OverviewService {
  public static async getOverview(): Promise<OverviewDTO> {
    const [apartmentCount, proSpaceCount] = await Promise.all([
      ApartmentService.getCount(),
      ProSpaceService.getCount(),
    ]);

    return { apartmentCount, proSpaceCount };
  }
}
