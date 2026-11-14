import pool from "../../db";
import { SafeUser } from "../../models/User";
import { UserDTO } from "../../types/user";
import UserService, { SAFE_USER_COLUMNS } from "../UserService";

export default class AdminUserService {
  public static async getAllUsers(): Promise<UserDTO[]> {
    const res = await pool.query<SafeUser>(
      `SELECT ${SAFE_USER_COLUMNS}
       FROM Users
       ORDER BY first_name, last_name, email ASC`,
    );

    return res.rows.map((row) => {
      return UserService.toUserDTO(row);
    });
  }
}
