import pool from "../../db";
import { apartmentKind, proSpaceKind, type SpaceTables } from "./spaceKinds";

export function createSpaceAccessService({
  accessTable,
  accessColumn,
}: SpaceTables) {
  return {
/** True if the user holds a live grant on at least one space of this kind (common-space media). */
    async hasAnyAccess(userId: string, isAdmin: boolean = false) {
      if (isAdmin) return true;

      const result = await pool.query(
        `SELECT 1
         FROM ${accessTable}
         WHERE user_id = $1
           AND (access_expiry IS NULL OR access_expiry > NOW())
         LIMIT 1`,
        [userId],
      );

      return (result.rowCount ?? 0) > 0;
    },

/** True if the user holds a live grant on this space. Admins always do. */
    async hasAccessTo(
      userId: string,
      spaceId: string,
      isAdmin: boolean = false,
    ) {
      if (isAdmin) return true;

      const result = await pool.query(
        `SELECT 1
         FROM ${accessTable}
         WHERE user_id = $1
           AND ${accessColumn} = $2
           AND (access_expiry IS NULL OR access_expiry > NOW())
         LIMIT 1`,
        [userId, spaceId],
      );

      return (result.rowCount ?? 0) > 0;
    },
  };
}

export const ApartmentAccessService = createSpaceAccessService(
  apartmentKind.tables,
);
export const ProSpaceAccessService = createSpaceAccessService(
  proSpaceKind.tables,
);
