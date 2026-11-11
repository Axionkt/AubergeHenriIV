import request from "supertest";
import { beforeAll, describe, expect, it, vi } from "vitest";
import app from "../app";
import pool from "../db";
import { sendEmailBatch } from "../emails/mailer";
import { audit } from "../utils/audit";
import { authCookie, createUser, type TestUser } from "./helpers";

// Keep the real audit logging, but record the calls.
vi.mock("../utils/audit", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../utils/audit")>();
  return { ...actual, audit: vi.fn(actual.audit) };
});

const PRO_SPACE = {
  name: "Bureau 12",
  description: "Bureau lumineux au premier étage.",
  type: "Bureau",
  sizeCarrezSqm: 25.5,
  sizeFloorSqm: 27,
  floor: "1er",
  orientation: "Est",
  view: "Cour",
  hasPrivateExterior: false,
  hasPrivateParking: true,
  electricHeatingModel: "Model H",
  bathroomTowelHeaterModel: "Model T",
  electricWaterHeaterModel: "Model W",
  kitchenCabinetsModel: "Model K",
  dpeEnergyRating: "C",
  dpeEnergyKwhPerSqmYear: 150,
  dpeEmissionsRating: "B",
  dpeEmissionsKgPerSqmYear: 10,
  previousTenantAnnualConsumptionEur: "900",
  hasDoubleGlazedWindows: true,
  meterPowerKva: 9,
  deliveryPointId: "12345678901234",
  hasFiberOptic: true,
  hasCopperNetwork: false,
  hasTvOutlet: false,
  landRegistryRefPre2025: "AB 123",
  landRegistryRefPost2025: "AB 456",
};

let admin: TestUser;
let tenant: TestUser;

beforeAll(async () => {
  admin = await createUser({ isAdmin: true });
  tenant = await createUser();
});

describe("admin: pro space creation and access grant", () => {
  let proSpaceId: string;

  it("creates a pro space and audits it", async () => {
    const res = await request(app)
      .post("/admin/pro-spaces")
      .set("Cookie", authCookie(admin))
      .send(PRO_SPACE);

    expect(res.status).toBe(201);
    proSpaceId = res.body;
    expect(proSpaceId).toMatch(/^[0-9a-f-]{36}$/);

    expect(audit).toHaveBeenCalledWith("space.create", {
      targetType: "pro-space",
      targetIds: [proSpaceId],
    });
  });

  it("grants a user access, persists it, notifies and audits it", async () => {
    const before = await request(app)
      .get(`/pro-spaces/${proSpaceId}`)
      .set("Cookie", authCookie(tenant));
    expect(before.status).toBe(403);

    const res = await request(app)
      .post("/admin/pro-spaces/user-accesses")
      .set("Cookie", authCookie(admin))
      .send({
        userIds: [tenant.id],
        proSpaceIds: [proSpaceId],
        accessExpiry: null,
      });
    expect(res.status).toBe(204);

    const { rows } = await pool.query(
      `SELECT access_expiry FROM UserProSpaceAccess
       WHERE user_id = $1 AND pro_space_id = $2`,
      [tenant.id, proSpaceId],
    );
    expect(rows).toEqual([{ access_expiry: null }]);

    // Audit records ids only: the admin is taken from the request context.
    expect(audit).toHaveBeenCalledWith("access.grant", {
      targetType: "pro-space",
      targetIds: [proSpaceId],
      userIds: [tenant.id],
      accessExpiry: null,
    });

    expect(sendEmailBatch).toHaveBeenCalledWith([
      expect.objectContaining({ to: tenant.email }),
    ]);

    const after = await request(app)
      .get(`/pro-spaces/${proSpaceId}`)
      .set("Cookie", authCookie(tenant));
    expect(after.status).toBe(200);
  });

  it("does not let a non-admin grant access", async () => {
    vi.mocked(audit).mockClear();

    const res = await request(app)
      .post("/admin/pro-spaces/user-accesses")
      .set("Cookie", authCookie(tenant))
      .send({
        userIds: [tenant.id],
        proSpaceIds: [proSpaceId],
        accessExpiry: null,
      });

    expect(res.status).toBe(403);
    expect(audit).not.toHaveBeenCalled();
  });
});
