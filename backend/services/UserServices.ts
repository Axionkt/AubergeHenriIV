import pool from "../db";
import User from "../models/User";
import { EditUserDetailsRequest } from "../schemas/user";
import { UserDTO } from "../types/user";
import { NotFoundError } from "../utils/errors/NotFoundError";

const fieldMap: Record<string, string> = {
  firstName: "first_name",
  lastName: "last_name",
  email: "email",
};

export default class UserServices {
  public static async getUserById(id: string): Promise<UserDTO> {
    const res = await pool.query<User>("SELECT * FROM Users WHERE id = $1", [
      id,
    ]);

    if (res.rowCount === 0) {
      throw new NotFoundError("Utilisateur introuvable.");
    }

    return {
      id: res.rows[0].id,
      email: res.rows[0].email,
      firstName: res.rows[0].first_name,
      lastName: res.rows[0].last_name,
      isAdmin: res.rows[0].is_admin,
      isVerified: res.rows[0].email_verified,
      createdAt: res.rows[0].created_at.toISOString(),
    };
  }

  public static async editUserDetails(
    id: string,
    details: EditUserDetailsRequest,
  ): Promise<void> {
    const fields = [];
    const values = [];
    let index = 1;

    for (const [key, value] of Object.entries(details)) {
      const col = fieldMap[key];
      if (!col) continue;
      fields.push(`${col} = $${index}`);
      values.push(value);
      index++;
    }

    values.push(id);

    const res = await pool.query<User>(
      `UPDATE Users SET ${fields.join(", ")} WHERE id = $${index}`,
      values,
    );

    if (res.rowCount === 0) {
      throw new NotFoundError("Utilisateur introuvable.");
    }
  }

  public static async deleteUser(id: string): Promise<void> {
    const res = await pool.query("DELETE FROM Users WHERE id = $1", [id]);

    if (res.rowCount === 0) {
      throw new NotFoundError("Utilisateur introuvable.");
    }
  }
}
