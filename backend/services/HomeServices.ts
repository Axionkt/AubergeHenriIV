import pool from "../db";
import Review from "../models/Review";
import { OverviewDTO } from "../types/overview";
import { ReviewDTO } from "../types/review";

export default class HomeServices {
  public static async getOverview(): Promise<OverviewDTO> {
    const res = await pool.query(
      `SELECT
        (SELECT COUNT(*) FROM Apartments) AS apartment_count,
        (SELECT COUNT(*) FROM ProSpaces) AS pro_space_count`,
    );

    return {
      apartmentCount: res.rows[0].apartment_count,
      proSpaceCount: res.rows[0].pro_space_count,
    };
  }

  public static async getAllReviews(): Promise<ReviewDTO[]> {
    const res = await pool.query<Review>(
      "SELECT * FROM Reviews ORDER BY created_at DESC",
    );

    return res.rows.map((row) => ({
      id: row.id,
      authorName: row.author_name,
      text: row.text,
      createdAt: row.created_at.toISOString(),
    }));
  }
}
