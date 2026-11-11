import request from "supertest";
import { beforeAll, describe, expect, it, vi } from "vitest";
import app from "../app";
import { sendEmailBatch } from "../emails/mailer";
import { audit } from "../utils/audit";
import { authCookie, createUser, type TestUser } from "./helpers";
import {
  KIND_NAMES,
  SPACE_KINDS,
  accessRows,
  createSpace,
  grantAccess,
  spaceCreateBody,
  type SpaceKindName,
} from "./spaceHelpers";

// Keep the real audit logging, but record the calls.
vi.mock("../utils/audit", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../utils/audit")>();
  return { ...actual, audit: vi.fn(actual.audit) };
});

let admin: TestUser;

beforeAll(async () => {
  admin = await createUser({ isAdmin: true });
});

describe.each(KIND_NAMES)("admin: %s lifecycle", (kind: SpaceKindName) => {
  const { path, adminPath, idsField } = SPACE_KINDS[kind];
  let tenant: TestUser;
  let spaceId: string;

  const asAdmin = (method: "post" | "put" | "delete", url: string) =>
    request(app)[method](url).set("Cookie", authCookie(admin));
  const tenantGet = () =>
    request(app).get(`${path}/${spaceId}`).set("Cookie", authCookie(tenant));

  beforeAll(async () => {
    tenant = await createUser();
  });

  it("creates a unit and audits it", async () => {
    const res = await asAdmin("post", adminPath).send(spaceCreateBody(kind));

    expect(res.status).toBe(201);
    spaceId = res.body;
    expect(spaceId).toMatch(/^[0-9a-f-]{36}$/);

    expect(audit).toHaveBeenCalledWith("space.create", {
      targetType: kind,
      targetIds: [spaceId],
    });
  });

  it("grants a user access, persists it, notifies and audits it", async () => {
    expect((await tenantGet()).status).toBe(403);

    const res = await asAdmin("post", `${adminPath}/user-accesses`).send({
      userIds: [tenant.id],
      [idsField]: [spaceId],
      accessExpiry: null,
    });
    expect(res.status).toBe(204);

    expect(await accessRows(kind, spaceId)).toEqual([
      { user_id: tenant.id, access_expiry: null },
    ]);

    // Audit records ids only: the admin is taken from the request context.
    expect(audit).toHaveBeenCalledWith("access.grant", {
      targetType: kind,
      targetIds: [spaceId],
      userIds: [tenant.id],
      accessExpiry: null,
    });

    expect(sendEmailBatch).toHaveBeenCalledWith([
      expect.objectContaining({ to: tenant.email }),
    ]);

    expect((await tenantGet()).status).toBe(200);
  });

  it("does not let a non-admin grant access", async () => {
    vi.mocked(audit).mockClear();
    const outsider = await createUser();

    const res = await request(app)
      .post(`${adminPath}/user-accesses`)
      .set("Cookie", authCookie(outsider))
      .send({
        userIds: [outsider.id],
        [idsField]: [spaceId],
        accessExpiry: null,
      });

    expect(res.status).toBe(403);
    expect(audit).not.toHaveBeenCalled();
    expect(await accessRows(kind, spaceId)).toHaveLength(1);
  });

  it("revokes access immediately, and audits it", async () => {
    const res = await asAdmin("delete", `${adminPath}/user-accesses`).send({
      userIds: [tenant.id],
      [idsField]: [spaceId],
    });
    expect(res.status).toBe(204);

    expect(await accessRows(kind, spaceId)).toEqual([]);
    expect(audit).toHaveBeenCalledWith("access.revoke", {
      targetType: kind,
      targetIds: [spaceId],
      userIds: [tenant.id],
    });
    expect((await tenantGet()).status).toBe(403);
  });

  it("revokes every grant when the unit is made unavailable with revokeAccesses", async () => {
    const otherSpace = await createSpace(kind, "Unit B");
    await grantAccess(kind, tenant.id, spaceId);
    await grantAccess(kind, tenant.id, otherSpace);

    const res = await asAdmin("put", `${adminPath}/${spaceId}/availability`).send(
      { isAvailable: false, revokeAccesses: true },
    );
    expect(res.status).toBe(204);

    expect(await accessRows(kind, spaceId)).toEqual([]);
    // Grants on other units are untouched.
    expect(await accessRows(kind, otherSpace)).toHaveLength(1);
  });
});
