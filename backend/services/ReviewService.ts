import pool from "../db";
import Review from "../models/Review";
import { ReviewDTO } from "../types/review";

export default class ReviewService {
  public static async getAllReviews(): Promise<ReviewDTO[]> {
    const res = await pool.query<Review>(
      "SELECT id, author_name, text, created_at, updated_at FROM Reviews ORDER BY created_at DESC",
    );

    return res.rows.map((row) => ({
      id: row.id,
      authorName: row.author_name,
      text: row.text,
      createdAt: row.created_at.toISOString(),
    }));
  }
}
