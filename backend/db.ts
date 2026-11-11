import { Pool, types } from "pg";
import { config } from "./config";
import { logError } from "./utils/logger";

types.setTypeParser(types.builtins.NUMERIC, (v) => parseFloat(v));

const pool = new Pool({
  host: config.DB_HOST,
  port: config.DB_PORT,
  user: config.DB_USER,
  password: config.DB_PASSWORD,
  database: config.DB_NAME,
});

pool.on("error", (err) =>
  logError(err, { forceServerError: true, operation: "db.poolError" }),
);

export default pool;
