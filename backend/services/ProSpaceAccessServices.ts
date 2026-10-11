import pool from "../db";

export default class ProSpaceAccessServices {
  public static async canRead(
    userId: string,
    proSpaceId: string,
    isAdmin: boolean = false,
  ): Promise<boolean> {
    if (isAdmin) return true;

    const res = await pool.query(
      `SELECT 1 FROM UserProSpaceAccess
        WHERE user_id = $1 
          AND pro_space_id = $2 
          AND (access_expiry IS NULL OR access_expiry > NOW()) 
        LIMIT 1`,
      [userId, proSpaceId],
    );

    return !!res.rowCount;
  }

  public static async canWrite(isAdmin: boolean): Promise<boolean> {
    return isAdmin;
  }
}
