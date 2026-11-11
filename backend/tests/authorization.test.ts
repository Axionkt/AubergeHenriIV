import jwt from "jsonwebtoken";
import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import app from "../app";
import { authCookie, createUser, type TestUser } from "./helpers";
import {
  KIND_NAMES,
  SPACE_KINDS,
  createMedia,
  createSpace,
  grantAccess,
  type SpaceKindName,
} from "./spaceHelpers";

let user: TestUser;
let admin: TestUser;

beforeAll(async () => {
  user = await createUser();
  admin = await createUser({ isAdmin: true });
});

const get = (path: string, as?: { id: string; isAdmin: boolean }) => {
  const req = request(app).get(path);
  return as ? req.set("Cookie", authCookie(as)) : req;
};

describe("admin routes", () => {
  it("refuses non-admins with 403", async () => {
    expect((await get("/admin/users", user)).status).toBe(403);
  });

  it("refuses anonymous callers with 401", async () => {
    expect((await get("/admin/users")).status).toBe(401);
  });

  it("lets admins in", async () => {
    expect((await get("/admin/users", admin)).status).toBe(200);
  });

  it("trusts the signed token, not a forged isAdmin claim", async () => {
    // Same payload shape, signed with the wrong secret.
    const forged = jwt.sign(
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

describe("user profiles", () => {
  it("refuses access to another user's profile", async () => {
    const other = await createUser();
    expect((await get(`/user/${other.id}`, user)).status).toBe(403);
  });

  it("allows access to one's own profile", async () => {
    const res = await get(`/user/${user.id}`, user);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(user.id);
  });
});

// Same guards for both kinds, but each kind has its own tables and media
// contexts, so a wiring slip would only break one of them.
describe.each(KIND_NAMES)("%s access", (kind: SpaceKindName) => {
  const { path, mediaContext, commonContext } = SPACE_KINDS[kind];
  const otherKind = KIND_NAMES.find((k) => k !== kind)!;
  let spaceId: string;

  beforeAll(async () => {
    spaceId = await createSpace(kind);
  });

  describe("unit grants", () => {
    it("refuses a user without a grant", async () => {
      const other = await createUser();
      expect((await get(`${path}/${spaceId}`, other)).status).toBe(403);
    });

    it("allows a user with a live grant", async () => {
      const tenant = await createUser();
      await grantAccess(kind, tenant.id, spaceId, 30);

      const res = await get(`${path}/${spaceId}`, tenant);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(spaceId);
      expect((await get(`${path}/${spaceId}/media`, tenant)).status).toBe(200);
    });

    it("allows a user with a grant that never expires", async () => {
      const tenant = await createUser();
      await grantAccess(kind, tenant.id, spaceId);
      expect((await get(`${path}/${spaceId}`, tenant)).status).toBe(200);
    });

    it("refuses a user whose grant has expired (before the nightly purge)", async () => {
      const former = await createUser();
      await grantAccess(kind, former.id, spaceId, -1);

      expect((await get(`${path}/${spaceId}`, former)).status).toBe(403);
      expect((await get(`${path}/${spaceId}/media`, former)).status).toBe(403);
    });

    it("does not extend a grant on one unit to another", async () => {
      const tenant = await createUser();
      await grantAccess(kind, tenant.id, spaceId);
      const otherSpace = await createSpace(kind, "Unit B");

      expect((await get(`${path}/${otherSpace}`, tenant)).status).toBe(403);
    });
  });

  describe("common areas", () => {
    it("are open to holders of a live grant on any unit of this kind only", async () => {
      const tenant = await createUser();
      await grantAccess(kind, tenant.id, spaceId);
      const otherKindTenant = await createUser();
      await grantAccess(otherKind, otherKindTenant.id, await createSpace(otherKind));
      const commonPhoto = await createMedia(commonContext, null, "REGULAR");

      expect((await get(`${path}/common-space/media`, tenant)).status).toBe(200);
      expect((await get(`/media/${commonPhoto.id}`, tenant)).status).toBe(200);

      expect(
        (await get(`${path}/common-space/media`, otherKindTenant)).status,
      ).toBe(403);
      expect((await get(`/media/${commonPhoto.id}`, otherKindTenant)).status).toBe(
        403,
      );
    });
  });

  describe("media", () => {
    it("serves thumbnails publicly, through nginx", async () => {
      const thumbnail = await createMedia(mediaContext, spaceId, "THUMBNAIL");

      const res = await get(`/media/${thumbnail.id}`);

      expect(res.status).toBe(200);
      expect(res.headers["x-accel-redirect"]).toBe(
        `/internal/storage/${thumbnail.filePath}`,
      );
    });

    it("requires a grant on the unit for regular media", async () => {
      const photo = await createMedia(mediaContext, spaceId, "REGULAR");
      const tenant = await createUser();
      await grantAccess(kind, tenant.id, spaceId);
      const stranger = await createUser();

      const anonymous = await get(`/media/${photo.id}`);
      expect(anonymous.status).toBe(401);
      expect(anonymous.headers["x-accel-redirect"]).toBeUndefined();

      const denied = await get(`/media/${photo.id}`, stranger);
      expect(denied.status).toBe(403);
      expect(denied.headers["x-accel-redirect"]).toBeUndefined();

      const allowed = await get(`/media/${photo.id}`, tenant);
      expect(allowed.status).toBe(200);
      expect(allowed.headers["x-accel-redirect"]).toBe(
        `/internal/storage/${photo.filePath}`,
      );
    });
  });
});

describe("route params", () => {
  it.each([
    ["/media/not-a-uuid", false],
    ["/apartments/not-a-uuid", true],
    ["/pro-spaces/not-a-uuid", true],
    ["/user/1%20OR%201=1", true],
  ])("rejects an invalid UUID in %s with 400", async (path, authenticated) => {
    const res = await get(path, authenticated ? user : undefined);
    expect(res.status).toBe(400);
  });
});
