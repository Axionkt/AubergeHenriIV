import cron from "node-cron";
import pool from "./db";

export function initCronJobs() {
  cron.schedule("0 0 * * *", async () => {
    const client = await pool.connect();
    try {
      const { rows } = await client.query("SELECT pg_try_advisory_lock(12345)");
      if (!rows[0].pg_try_advisory_lock) {
        console.log(
          "[cron] flush_expired_data: skipped (another instance is running it)",
        );
        return;
      }
      await client.query("SELECT flush_expired_data()");
      console.log("[cron] flush_expired_data: done");
    } catch (err) {
      console.error("[cron] flush_expired_data: failed", err);
    } finally {
      await client.query("SELECT pg_advisory_unlock(12345)");
      client.release();
    }
  });
}
