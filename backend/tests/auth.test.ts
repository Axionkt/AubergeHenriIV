import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import app from "../app";
import pool from "../db";
import { sendEmail } from "../emails/mailer";
import { hashToken } from "../utils/hashToken";
import {
  PASSWORD,
  createUser,
  getCookie,
  lastEmailedToken,
  uniqueEmail,
} from "./helpers";

// Request ids differ on every response; everything else must match.
const withoutRequestId = (body: Record<string, unknown>) => {
  const { requestId: _ignored, ...rest } = body;
  return rest;
};

async function storedUser(email: string) {
  const { rows } = await pool.query(
    `SELECT email, email_verified, email_verification_token,
            password_reset_token, token_version
     FROM Users WHERE email = $1`,
    [email],
  );
  return rows[0];
}

async function login(email: string, password = PASSWORD) {
  return request(app).post("/auth/login").send({ email, password });
}

// The refresh cookie is scoped to /api/auth/refresh (nginx adds /api), but
// the app is mounted without the prefix, so supertest would never send it.
function refresh(refreshToken: string) {
  return request(app)
    .post("/auth/refresh")
    .set("Cookie", `refreshToken=${refreshToken}`);
}

describe("registration and email verification", () => {
  const email = uniqueEmail();
  let rawToken: string; // as read from the emailed link

  it("stores only the SHA-256 of the verification token", async () => {
    const res = await request(app).post("/auth/register").send({
      email: email.toUpperCase(),
      password: PASSWORD,
      firstName: "Ada",
      lastName: "Lovelace",
    });
    expect(res.status).toBe(201);

    const user = await storedUser(email);
    rawToken = lastEmailedToken(email);

    expect(user.email).toBe(email); // lowercased on the way in
    expect(user.email_verified).toBe(false);
    expect(user.email_verification_token).toMatch(/^[0-9a-f]{64}$/);
    expect(user.email_verification_token).not.toBe(rawToken);
    expect(user.email_verification_token).toBe(hashToken(rawToken));
  });

  it("does not accept the stored hash as a token (a DB leak yields no links)", async () => {
    const { email_verification_token } = await storedUser(email);

    const res = await request(app)
      .post("/auth/verify-email")
      .send({ token: email_verification_token });

    expect(res.status).toBe(400);
  });

  it("verifies the email with the raw token, and only once", async () => {
    const token = rawToken;

    const first = await request(app).post("/auth/verify-email").send({ token });
    expect(first.status).toBe(200);

    const user = await storedUser(email);
    expect(user.email_verified).toBe(true);
    expect(user.email_verification_token).toBeNull();

    const second = await request(app).post("/auth/verify-email").send({ token });
    expect(second.status).toBe(400);
    expect(second.body.message).toBe("Lien invalide ou expiré.");
  });
});

describe("login", () => {
  it("matches the email case-insensitively", async () => {
    const user = await createUser();

    const res = await login(user.email.toUpperCase());

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(user.id);
    expect(getCookie(res, "accessToken")).toBeTruthy();
    expect(getCookie(res, "refreshToken")).toBeTruthy();
  });

  it("gives the same 401 for an unknown email and a wrong password", async () => {
    const user = await createUser();

    const unknown = await login(uniqueEmail());
    const wrongPassword = await login(user.email, "Wrong-Password-1");

    expect(unknown.status).toBe(401);
    expect(wrongPassword.status).toBe(401);
    expect(withoutRequestId(unknown.body)).toEqual(
      withoutRequestId(wrongPassword.body),
    );
  });

  it("refuses unverified accounts with 403", async () => {
    const user = await createUser({ verified: false });

    const res = await login(user.email);

    expect(res.status).toBe(403);
    expect(getCookie(res, "accessToken")).toBeUndefined();
  });

  it("tells Google-only accounts to use the Google button", async () => {
    const email = uniqueEmail();
    const google = await request(app)
      .post("/auth/google/register")
      .send({ googleToken: `google:${email}` });
    expect(google.status).toBe(201);

    const res = await login(email, "Any-Password-1");

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/Google/);
  });
});

describe("GET /auth/me", () => {
  it("returns a plain UserDTO, without token_version", async () => {
    const user = await createUser();
    const loginRes = await login(user.email);
    const accessToken = getCookie(loginRes, "accessToken");

    const res = await request(app)
      .get("/auth/me")
      .set("Cookie", `accessToken=${accessToken}`);

    expect(res.status).toBe(200);
    expect(Object.keys(res.body).sort()).toEqual([
      "createdAt",
      "email",
      "firstName",
      "id",
      "isAdmin",
      "isVerified",
      "lastName",
    ]);
    expect(res.body).toMatchObject({ id: user.id, email: user.email });
    expect(loginRes.body).not.toHaveProperty("tokenVersion");
  });

  it("rejects requests without an access token", async () => {
    const res = await request(app).get("/auth/me");
    expect(res.status).toBe(401);
  });
});

describe("sessions and password reset", () => {
  async function requestResetToken(email: string) {
    const res = await request(app)
      .post("/auth/forgot-password")
      .send({ email });
    expect(res.status).toBe(200);
    return lastEmailedToken(email);
  }

  it("issues a new token pair from a valid refresh token", async () => {
    const user = await createUser();
    const refreshToken = getCookie(await login(user.email), "refreshToken")!;

    const res = await refresh(refreshToken);

    expect(res.status).toBe(200);
    expect(getCookie(res, "accessToken")).toBeTruthy();
    expect(getCookie(res, "refreshToken")).toBeTruthy();
  });

  it("revokes every existing refresh token on password reset", async () => {
    const user = await createUser();
    const oldRefresh = getCookie(await login(user.email), "refreshToken")!;
    expect((await storedUser(user.email)).token_version).toBe(0);

    const token = await requestResetToken(user.email);
    const reset = await request(app)
      .post("/auth/reset-password")
      .send({ token, password: "Brand-New-Pass-2" });
    expect(reset.status).toBe(200);

    expect((await storedUser(user.email)).token_version).toBe(1);

    const res = await refresh(oldRefresh);
    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Session invalide.");

    // A session opened with the new password works.
    const newLogin = await login(user.email, "Brand-New-Pass-2");
    expect(newLogin.status).toBe(200);
    expect((await refresh(getCookie(newLogin, "refreshToken")!)).status).toBe(
      200,
    );
  });

  it("stores the reset token hashed and accepts it only once", async () => {
    const user = await createUser();
    const token = await requestResetToken(user.email);

    expect((await storedUser(user.email)).password_reset_token).toBe(
      hashToken(token),
    );

    const first = await request(app)
      .post("/auth/reset-password")
      .send({ token, password: "First-Reset-Pass-3" });
    expect(first.status).toBe(200);

    const second = await request(app)
      .post("/auth/reset-password")
      .send({ token, password: "Second-Reset-Pass-4" });
    expect(second.status).toBe(400);
    expect(second.body.message).toBe("Lien invalide ou expiré.");

    expect((await login(user.email, "First-Reset-Pass-3")).status).toBe(200);
  });
});

describe("anti-enumeration", () => {
  it("forgot-password answers the same for unknown emails, and sends nothing", async () => {
    const user = await createUser();
    const unknownEmail = uniqueEmail();
    vi.mocked(sendEmail).mockClear();

    const known = await request(app)
      .post("/auth/forgot-password")
      .send({ email: user.email });
    const unknown = await request(app)
      .post("/auth/forgot-password")
      .send({ email: unknownEmail });

    expect(unknown.status).toBe(known.status);
    expect(unknown.body).toEqual(known.body);
    const recipients = vi.mocked(sendEmail).mock.calls.map(([m]) => m.to);
    expect(recipients).toEqual([user.email]);
  });

  it("resend-verification answers the same for unknown and verified emails", async () => {
    const unverified = await createUser({ verified: false });
    const verified = await createUser({ verified: true });
    vi.mocked(sendEmail).mockClear();

    const responses = await Promise.all(
      [unverified.email, verified.email, uniqueEmail()].map((email) =>
        request(app).post("/auth/resend-verification").send({ email }),
      ),
    );

    for (const res of responses) {
      expect(res.status).toBe(200);
      expect(res.body).toEqual(responses[0].body);
    }
    const recipients = vi.mocked(sendEmail).mock.calls.map(([m]) => m.to);
    expect(recipients).toEqual([unverified.email]);
  });
});
