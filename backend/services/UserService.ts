import pool from "../db";
import { SafeUser } from "../models/User";
import { EditUserDetailsRequest } from "../schemas/user";
import { UserDTO } from "../types/user";
import { BadRequestError } from "../utils/errors/BadRequestError";
import { NotFoundError } from "../utils/errors/NotFoundError";
import { buildSet } from "../utils/sql";

/** Never select password hashes or tokens unless a query needs them. */
export const SAFE_USER_COLUMNS =
  "id, email, first_name, last_name, is_admin, email_verified, created_at, token_version";

export default class UserService {
  public static async getUserById(id: string): Promise<UserDTO> {
    return (await this.getSession(id)).user;
  }

  /** User plus the token_version that refresh tokens must match. */
  public static async getSession(
    id: string,
  ): Promise<{ user: UserDTO; tokenVersion: number }> {
    const res = await pool.query<SafeUser>(
      `SELECT ${SAFE_USER_COLUMNS} FROM Users WHERE id = $1`,
      [id],
    );

    if (res.rowCount === 0) {
      throw new NotFoundError("Utilisateur introuvable.");
    }

    return UserService.toSession(res.rows[0]);
  }

  public static async editUserDetails(
    id: string,
    details: EditUserDetailsRequest,
  ): Promise<void> {
    const { clauses, values } = buildSet(
      { firstName: "first_name", lastName: "last_name" },
      details,
    );

    if (clauses.length === 0) {
      throw new BadRequestError("Aucun champ à modifier.");
    }

    values.push(id);

    const res = await pool.query(
      `UPDATE Users SET ${clauses.join(", ")} WHERE id = $${values.length}`,
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

  public static toUserDTO(row: SafeUser): UserDTO {
    return {
      id: row.id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      isAdmin: row.is_admin,
      isVerified: row.email_verified,
      createdAt: row.created_at.toISOString(),
    };
  }

  public static toSession(row: SafeUser) {
    return { user: UserService.toUserDTO(row), tokenVersion: row.token_version };
  }
}
