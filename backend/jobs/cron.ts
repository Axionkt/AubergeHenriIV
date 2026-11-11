import cron from "node-cron";
import pool from "../db";
import { purgeStaleUploads } from "../utils/uploadStorage";
import { logger, logError } from "../utils/logger";
import { normalizeError } from "../utils/errors/normalizeError";

/**
 * Daily: deletes expired unverified accounts and expired access grants
 * (flush_expired_data in SQL), under an advisory lock so only one instance
 * runs it. Hourly: removes orphaned upload temp files.
 */
export function initCronJobs() {
  cron.schedule("0 0 * * *", async () => {
    const operation = "cron.flushExpiredData";
    let client;

    try {
      client = await pool.connect();

      const { rows } = await client.query("SELECT pg_try_advisory_lock(12346)");

      const locked = rows[0].pg_try_advisory_lock;

      if (!locked) {
        logger.info({
          event: "cron_skipped",
          operation,
          reason: "already_running_on_another_instance",
        });
        return;
      }

      await client.query("SELECT flush_expired_data()");

      logger.info({
        event: "cron_completed",
        operation,
      });
    } catch (err) {
      logError(normalizeError(err), {
        forceServerError: true,
        operation,
      });
    } finally {
      if (client) {
        try {
          // Release the advisory lock only if this instance acquired it.
          await client.query("SELECT pg_advisory_unlock(12346)");
        } catch (err) {
          logError(normalizeError(err), {
            forceServerError: true,
            operation: `${operation}.releaseLock`,
          });
        } finally {
          client.release();
        }
      }
    }
  });

  cron.schedule("0 * * * *", async () => {
    const operation = "cron.purgeStaleUploads";

    try {
      await purgeStaleUploads();

      logger.info({
        event: "cron_completed",
        operation,
      });
    } catch (err) {
      logError(normalizeError(err), {
        forceServerError: true,
        operation,
      });
    }
  });
}
