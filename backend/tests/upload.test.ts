import fs from "node:fs";
import path from "node:path";
import request from "supertest";
import { beforeAll, describe, expect, it, vi } from "vitest";
import app from "../app";
import pool from "../db";
import { authCookie, createUser, type TestUser } from "./helpers";
import { createSpace } from "./spaceHelpers";

// A real 1x1 PNG.
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);
const HTML = Buffer.from("<html><script>alert(document.cookie)</script></html>");

const storageRoot = () => process.env.STORAGE_ROOT!;
const tmpFiles = () => {
  const dir = path.join(storageRoot(), ".tmp");
  return fs.existsSync(dir) ? fs.readdirSync(dir) : [];
};

let admin: TestUser;
let apartmentId: string;

beforeAll(async () => {
  admin = await createUser({ isAdmin: true });
  apartmentId = await createSpace("apartment");
});

function upload(file: Buffer, filename: string, contentType: string) {
  return request(app)
    .post(`/admin/media/apartment/${apartmentId}`)
    .set("Cookie", authCookie(admin))
    .attach("files", file, { filename, contentType });
}

describe("media upload: the file type comes from the bytes", () => {
  it.each([
    ["HTML disguised as a PNG", HTML, "photo.png", "image/png"],
    ["a PNG declared as JPEG", PNG, "photo.png", "image/jpeg"],
    ["a PNG with an .html name", PNG, "photo.html", "image/png"],
  ])("rejects %s, stores nothing, and cleans up", async (_, file, name, type) => {
    const res = await upload(file, name, type);

    expect(res.status).toBe(400);
    const { rows } = await pool.query("SELECT 1 FROM Media");
    expect(rows).toHaveLength(0);
    // Temp files are removed when the response closes.
    await vi.waitFor(() => expect(tmpFiles()).toEqual([]));
  });

  it("stores a real image under a random name and serves it via nginx", async () => {
    const res = await upload(PNG, "../../etc/passwd.png", "image/png");
    expect(res.status).toBe(201);

    const { rows } = await pool.query<{ id: string; file_path: string }>(
      "SELECT id, file_path FROM Media",
    );
    expect(rows).toHaveLength(1);
    const { id, file_path } = rows[0];

    // The client's file name never reaches the filesystem.
    expect(file_path).toMatch(
      new RegExp(`^apartment/${apartmentId}/[0-9a-f-]{36}\\.png$`),
    );
    expect(fs.readFileSync(path.join(storageRoot(), file_path))).toEqual(PNG);

    const served = await request(app)
      .get(`/media/${id}`)
      .set("Cookie", authCookie(admin));
    expect(served.status).toBe(200);
    expect(served.headers["x-accel-redirect"]).toBe(
      `/internal/storage/${file_path}`,
    );
  });
});
