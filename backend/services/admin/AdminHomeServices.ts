import pool from "../../db";
import Review from "../../models/Review";
import { NotFoundError } from "../../utils/errors/NotFoundError";
import { ReviewDTO } from "../../types/review";
import { CreateReviewRequest, UpdateReviewRequest } from "../../schemas/review";

const fieldMap: Record<string, string> = {
  authorName: "author_name",
  text: "text",
  createdAt: "created_at",
};

export default class AdminHomeServices {
  public static async createReview(
    reviewData: CreateReviewRequest,
  ): Promise<ReviewDTO> {
    const res = await pool.query<Review>(
      `INSERT INTO Reviews (author_name, text, created_at, updated_at)
          VALUES ($1, $2, COALESCE($3, NOW()), NOW())
          RETURNING *`,
      [reviewData.authorName, reviewData.text, reviewData.createdAt],
    );

    return {
      id: res.rows[0].id,
      authorName: res.rows[0].author_name,
      text: res.rows[0].text,
      createdAt: res.rows[0].created_at.toISOString(),
    };
  }

  public static async updateReview(
    reviewId: number,
    reviewData: UpdateReviewRequest,
  ): Promise<ReviewDTO> {
    const fields = [];
    const values = [];
    let index = 1;

    for (const [key, value] of Object.entries(reviewData)) {
      const col = fieldMap[key];
      if (!col) continue;
      fields.push(`${col} = $${index}`);
      values.push(value);
      index++;
    }

    values.push(reviewId);

    const query = `
      UPDATE Reviews SET ${fields.join(", ")}, updated_at = NOW()
      WHERE id = $${index}
      RETURNING *`;

    const res = await pool.query<Review>(query, values);

    if (res.rowCount === 0) {
      throw new NotFoundError("Avis introuvable.");
    }

    return {
      id: res.rows[0].id,
      authorName: res.rows[0].author_name,
      text: res.rows[0].text,
      createdAt: res.rows[0].created_at.toISOString(),
    };
  }

  public static async deleteReview(reviewId: number): Promise<void> {
    const res = await pool.query(`DELETE FROM Reviews WHERE id = $1`, [
      reviewId,
    ]);

    if (res.rowCount === 0) {
      throw new NotFoundError("Avis introuvable.");
    }
  }
}
