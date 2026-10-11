import pool from "../../db";
import User from "../../models/User";
import { UserDTO } from "../../types/user";

export default class AdminUserServices {
  public static async getAllUsers(): Promise<UserDTO[]> {
    const res = await pool.query<User>(
      "SELECT * FROM Users ORDER BY first_name, last_name, email ASC",
    );

    return res.rows.map((row) => {
      return {
        id: row.id,
        email: row.email,
        firstName: row.first_name,
        lastName: row.last_name,
        isAdmin: row.is_admin,
        isVerified: row.email_verified,
        createdAt: row.created_at.toISOString(),
      };
    });
  }
}
