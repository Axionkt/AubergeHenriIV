import pool from "../db";

export default class ApartmentAccessServices {
  public static async canRead(
    userId: string,
    apartmentId: string,
    isAdmin: boolean = false,
  ): Promise<boolean> {
    if (isAdmin) return true;

    const res = await pool.query(
      `SELECT 1 FROM UserApartmentAccess
        WHERE user_id = $1 
          AND apartment_id = $2 
          AND (access_expiry IS NULL OR access_expiry > NOW()) 
        LIMIT 1`,
      [userId, apartmentId],
    );

    return !!res.rowCount;
  }

  public static async canWrite(isAdmin: boolean): Promise<boolean> {
    return isAdmin;
  }
}
