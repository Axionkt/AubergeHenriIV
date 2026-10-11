import pool from "../db";

export default class CommonSpaceAccessServices {
  public static async canRead(
    userId: string,
    isAdmin: boolean = false,
  ): Promise<boolean> {
    if (isAdmin) return true;

    const res = await pool.query(
      `SELECT 1 
        FROM UserApartmentAccess
        WHERE user_id = $1
          AND (access_expiry IS NULL OR access_expiry > NOW())
        LIMIT 1

        UNION ALL

        SELECT 1 FROM UserProSpaceAccess WHERE user_id = $1
          AND (access_expiry IS NULL OR access_expiry > NOW())
        LIMIT 1`,
      [userId],
    );

    return !!res.rowCount;
  }

  public static async canWrite(isAdmin: boolean): Promise<boolean> {
    return isAdmin;
  }
}
