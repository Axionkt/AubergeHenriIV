import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import app from "../app";
import {
  authCookie,
  createApartment,
  createMedia,
  createUser,
  grantApartment,
  type TestUser,
} from "./helpers";

let user: TestUser;
let admin: TestUser;
let apartmentId: string;

beforeAll(async () => {
  user = await createUser();
  admin = await createUser({ isAdmin: true });
  apartmentId = await createApartment();
});

describe("admin routes", () => {
  it("refuses non-admins with 403", async () => {
    const res = await request(app)
      .get("/admin/users")
      .set("Cookie", authCookie(user));
    expect(res.status).toBe(403);
  });

  it("refuses anonymous callers with 401", async () => {
    expect((await request(app).get("/admin/users")).status).toBe(401);
  });

  it("lets admins in", async () => {
    const res = await request(app)
      .get("/admin/users")
      .set("Cookie", authCookie(admin));
    expect(res.status).toBe(200);
  });

  it("trusts the signed token, not a forged isAdmin claim", async () => {
    // Same payload shape, signed with the wrong secret.
    const jwt = await import("jsonwebtoken");
    const forged = jwt.default.sign(
      { sub: user.id, isAdmin: true },
      "not-the-real-secret-but-32-chars-long!!",
      { algorithm: "HS256" },
    );
    const res = await request(app)
      .get("/admin/users")
      .set("Cookie", `accessToken=${forged}`);
    expect(res.status).toBe(401);
  });
});

describe("apartment access grants", () => {
  it("refuses a user without a grant", async () => {
    const other = await createUser();
    const res = await request(app)
      .get(`/apartments/${apartmentId}`)
      .set("Cookie", authCookie(other));
    expect(res.status).toBe(403);
  });

  it("allows a user with a live grant", async () => {
    const tenant = await createUser();
    await grantApartment(tenant.id, apartmentId, 30);

    const res = await request(app)
      .get(`/apartments/${apartmentId}`)
      .set("Cookie", authCookie(tenant));
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(apartmentId);
  });

  it("allows a user with a grant that never expires", async () => {
    const tenant = await createUser();
    await grantApartment(tenant.id, apartmentId);

    const res = await request(app)
      .get(`/apartments/${apartmentId}`)
      .set("Cookie", authCookie(tenant));
    expect(res.status).toBe(200);
  });

  it("refuses a user whose grant has expired (before the nightly purge)", async () => {
    const former = await createUser();
    await grantApartment(former.id, apartmentId, -1);

    const res = await request(app)
      .get(`/apartments/${apartmentId}`)
      .set("Cookie", authCookie(former));
    expect(res.status).toBe(403);
  });

  it("does not extend a grant on one apartment to another", async () => {
    const tenant = await createUser();
    await grantApartment(tenant.id, apartmentId);
    const otherApartment = await createApartment("Apartment B");

    const res = await request(app)
      .get(`/apartments/${otherApartment}`)
      .set("Cookie", authCookie(tenant));
    expect(res.status).toBe(403);
  });
});

describe("user profiles", () => {
  it("refuses access to another user's profile", async () => {
    const other = await createUser();
    const res = await request(app)
      .get(`/user/${other.id}`)
      .set("Cookie", authCookie(user));
    expect(res.status).toBe(403);
  });

  it("allows access to one's own profile", async () => {
    const res = await request(app)
      .get(`/user/${user.id}`)
      .set("Cookie", authCookie(user));
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(user.id);
  });
});

describe("media", () => {
  it("serves thumbnails publicly, through nginx", async () => {
    const thumbnail = await createMedia(apartmentId, "THUMBNAIL");

    const res = await request(app).get(`/media/${thumbnail.id}`);

    expect(res.status).toBe(200);
    expect(res.headers["x-accel-redirect"]).toBe(
      `/internal/storage/${thumbnail.filePath}`,
    );
  });

  it("requires a grant on the unit for regular media", async () => {
    const photo = await createMedia(apartmentId, "REGULAR");
    const tenant = await createUser();
    await grantApartment(tenant.id, apartmentId);
    const stranger = await createUser();

    const anonymous = await request(app).get(`/media/${photo.id}`);
    expect(anonymous.status).toBe(401);
    expect(anonymous.headers["x-accel-redirect"]).toBeUndefined();

    const denied = await request(app)
      .get(`/media/${photo.id}`)
      .set("Cookie", authCookie(stranger));
    expect(denied.status).toBe(403);
    expect(denied.headers["x-accel-redirect"]).toBeUndefined();

    const allowed = await request(app)
      .get(`/media/${photo.id}`)
      .set("Cookie", authCookie(tenant));
    expect(allowed.status).toBe(200);
    expect(allowed.headers["x-accel-redirect"]).toBe(
      `/internal/storage/${photo.filePath}`,
    );
  });
});

describe("route params", () => {
  it.each([
    ["/media/not-a-uuid", undefined],
    ["/apartments/not-a-uuid", "user"],
    ["/user/1%20OR%201=1", "user"],
  ])("rejects an invalid UUID in %s with 400", async (path, as) => {
    const req = request(app).get(path);
    if (as) req.set("Cookie", authCookie(user));
    const res = await req;
    expect(res.status).toBe(400);
  });
});
