import type { ApartmentRow, ProSpaceRow, SpaceRow } from "../../models/Space";
import type {
  CommonSpaceMediaContext,
  MediaContext,
} from "../../schemas/media";
import type { ApartmentExtraInput } from "../../schemas/apartment";
import type { ApartmentExtraDTO } from "../../types/space";

export interface SpaceTables {
  table: "Apartments" | "ProSpaces";
  accessTable: "UserApartmentAccess" | "UserProSpaceAccess";
  accessColumn: "apartment_id" | "pro_space_id";
  mediaContext: Extract<MediaContext, "apartment" | "pro-space">;
  commonMediaContext: CommonSpaceMediaContext;
  notFoundMessage: string;
  notifyKind: "apartment" | "proSpace";
}

/**
 * Everything that differs between kinds of spaces. To give one kind a new
 * field: add the column (migration), the Zod field in its schema file, and
 * map it in extraToDTO / extraToDB below. If a kind's behavior diverges,
 * override or add methods where the service is instantiated.
 */
export interface SpaceKind<
  TRow extends SpaceRow,
  TExtraDTO extends object,
  TExtraInput extends object,
> {
  tables: SpaceTables;
  extraToDTO: (row: TRow) => TExtraDTO;
  extraToDB: (data: Partial<TExtraInput>) => Record<string, unknown>;
}

export const apartmentKind: SpaceKind<
  ApartmentRow,
  ApartmentExtraDTO,
  ApartmentExtraInput
> = {
  tables: {
    table: "Apartments",
    accessTable: "UserApartmentAccess",
    accessColumn: "apartment_id",
    mediaContext: "apartment",
    commonMediaContext: "apartment-common",
    notFoundMessage: "Appartement introuvable.",
    notifyKind: "apartment",
  },
  extraToDTO: (row) => ({
    inductionCooktopModel: row.induction_cooktop_model,
    ovenModel: row.oven_model,
    rangeHoodModel: row.range_hood_model,
  }),
  extraToDB: (data) => ({
    induction_cooktop_model: data.inductionCooktopModel,
    oven_model: data.ovenModel,
    range_hood_model: data.rangeHoodModel,
  }),
};

export const proSpaceKind: SpaceKind<ProSpaceRow, object, object> = {
  tables: {
    table: "ProSpaces",
    accessTable: "UserProSpaceAccess",
    accessColumn: "pro_space_id",
    mediaContext: "pro-space",
    commonMediaContext: "pro-space-common",
    notFoundMessage: "Espace professionnel introuvable.",
    notifyKind: "proSpace",
  },
  extraToDTO: () => ({}),
  extraToDB: () => ({}),
};
