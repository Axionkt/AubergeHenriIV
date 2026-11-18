import Router from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { authenticationMiddleware } from "../middleware/authenticationMiddleware";
import AuthService from "../services/AuthService";
import {
  browseLimiter,
  forgotPasswordLimiter,
  loginLimiter,
  googleCallbackLimiter,
  refreshLimiter,
  registerLimiter,
  resendVerificationLimiter,
  resetPasswordLimiter,
  verifyEmailLimiter,
} from "../middleware/rateLimiting";
import { refreshTokenMiddleware } from "../middleware/refreshTokenMiddleware";
import UserService from "../services/UserService";
import {
  validateRegisterRequest,
  validateVerifyEmailBody,
  validateResendVerificationRequest,
  validateForgotPasswordRequest,
  validateResetPasswordRequest,
  validateLoginRequest,
} from "../schemas/auth";
import { assertValid } from "../utils/validation";
import { clearAuthCookies, setAuthCookies } from "../utils/authCookies";
import {
  clearGoogleOAuthCookie,
  randomToken,
  readGoogleOAuthCookie,
  safeReturnTo,
  sameToken,
  setGoogleOAuthCookie,
  type GoogleIntent,
} from "../utils/googleOAuthState";
import { AppError } from "../utils/errors/AppError";
import { ForbiddenError } from "../utils/errors/ForbiddenError";
import { logError } from "../utils/logger";
import { NotFoundError } from "../utils/errors/NotFoundError";
import { UnauthorizedError } from "../utils/errors/UnauthorizedError";

const router = Router();

router.post(
  "/register",
  registerLimiter,
  asyncHandler(async (req, res) => {
    const result = assertValid(validateRegisterRequest(req.body));

    await AuthService.register(result);

    res.status(201).json({ message: "Email de vérification envoyé." });
  }),
);

router.post(
  "/verify-email",
  verifyEmailLimiter,
  asyncHandler(async (req, res) => {
    const result = assertValid(validateVerifyEmailBody(req.body));

    await AuthService.verifyEmail(result.token);

    res.status(200).json({ message: "Adresse e-mail vérifiée avec succès." });
  }),
);

router.post(
  "/resend-verification",
  resendVerificationLimiter,
  asyncHandler(async (req, res) => {
    const result = assertValid(validateResendVerificationRequest(req.body));

    await AuthService.resendVerification(result.email);

    res.status(200).json({
      message:
        "Si un compte non vérifié existe pour cet e-mail, un lien a été envoyé.",
    });
  }),
);

router.post(
  "/forgot-password",
  forgotPasswordLimiter,
  asyncHandler(async (req, res) => {
    if (req.body?._hp) {
      res.status(200).json({ message: "E-mail envoyé si le compte existe." });
      return;
    }

    const result = assertValid(validateForgotPasswordRequest(req.body));

    await AuthService.requestPasswordReset(result.email);
    res.status(200).json({ message: "E-mail envoyé si le compte existe." });
  }),
);

router.post(
  "/reset-password",
  resetPasswordLimiter,
  asyncHandler(async (req, res) => {
    const result = assertValid(validateResetPasswordRequest(req.body));

    await AuthService.resetPassword(result.token, result.password);
    res.status(200).json({ message: "Mot de passe réinitialisé." });
  }),
);

router.post(
  "/login",
  loginLimiter,
  asyncHandler(async (req, res) => {
    const result = assertValid(validateLoginRequest(req.body));

    const { user, tokenVersion } = await AuthService.verifyCredentials(
      result.email,
      result.password,
    );

    setAuthCookies(res, { id: user.id, isAdmin: user.isAdmin, tokenVersion });
    res.status(200).json(user);
  }),
);

// ---------------------------------------------------------------------------
// Google sign-in: authorization code flow with PKCE. The site loads nothing
// from Google; the browser only goes there after the user clicks the button.
// ---------------------------------------------------------------------------

/** Error codes shown by the login/register pages (?erreur=...). */
type GoogleError =
  "cancelled" | "expired" | "failed" | "unverified" | "exists" | "not_found";

const authPage = (intent: GoogleIntent) =>
  intent === "register" ? "/inscription" : "/connexion";

router.get("/google/start", (req, res) => {
  const intent: GoogleIntent =
    req.query.intent === "register" ? "register" : "login";
  const attempt = {
    state: randomToken(),
    verifier: randomToken(),
    nonce: randomToken(),
    intent,
    returnTo: safeReturnTo(req.query.returnTo),
  };

  // These responses set cookies: never let a cache (Cloudflare) keep them.
  res.set("Cache-Control", "no-store");
  setGoogleOAuthCookie(res, attempt);
  res.redirect(303, AuthService.googleAuthUrl(attempt));
});

router.get(
  "/google/callback",
  googleCallbackLimiter,
  asyncHandler(async (req, res) => {
    const attempt = readGoogleOAuthCookie(req);
    res.set("Cache-Control", "no-store");
    clearGoogleOAuthCookie(res);

    const fail = (error: GoogleError) =>
      res.redirect(
        303,
        `${authPage(attempt?.intent ?? "login")}?erreur=${error}`,
      );

    const { code, state, error } = req.query;
    if (
      !attempt ||
      typeof state !== "string" ||
      !sameToken(state, attempt.state)
    ) {
      return fail("expired");
    }
    if (error === "access_denied") return fail("cancelled");
    if (typeof code !== "string" || code.length > 2048) return fail("failed");

    let profile;
    try {
      profile = await AuthService.exchangeGoogleCode(
        code,
        attempt.verifier,
        attempt.nonce,
      );
    } catch (err) {
      return fail(err instanceof ForbiddenError ? "unverified" : "failed");
    }

    let session;
    try {
      session =
        attempt.intent === "register"
          ? await AuthService.registerGoogle(profile)
          : await AuthService.verifyCredentialsGoogle(profile.email);
    } catch (err) {
      if (err instanceof AppError && err.statusCode < 500) {
        return fail(attempt.intent === "register" ? "exists" : "not_found");
      }
      logError(err, { operation: "auth.googleCallback" });
      return fail("failed");
    }

    const { user, tokenVersion } = session;
    setAuthCookies(res, { id: user.id, isAdmin: user.isAdmin, tokenVersion });
    res.redirect(
      303,
      attempt.returnTo ??
        (user.isAdmin && attempt.intent === "login" ? "/admin" : "/"),
    );
  }),
);

router.post(
  "/refresh",
  // Decode first so the limiter can key on the user instead of the IP.
  refreshTokenMiddleware,
  refreshLimiter,
  asyncHandler(async (req, res) => {
    const { sub, v } = req.decodedRefreshToken!;

    let session;

    try {
      session = await UserService.getSession(sub);
    } catch (error) {
      if (error instanceof NotFoundError) {
        clearAuthCookies(res);
        throw new UnauthorizedError("Session invalide.");
      }

      throw error;
    }

    // Bumped by a password reset: every older refresh token is dead.
    if (session.tokenVersion !== v) {
      clearAuthCookies(res);
      throw new UnauthorizedError("Session invalide.");
    }

    setAuthCookies(res, {
      id: session.user.id,
      isAdmin: session.user.isAdmin,
      tokenVersion: session.tokenVersion,
    });

    res.sendStatus(200);
  }),
);

router.post(
  "/logout",
  asyncHandler(async (_req, res) => {
    clearAuthCookies(res);
    res.sendStatus(204);
  }),
);

router.get(
  "/me",
  authenticationMiddleware,
  browseLimiter,
  asyncHandler(async (req, res) => {
    const user = await UserService.getUserById(req.user!.sub);

    res.status(200).json(user);
  }),
);

export default router;
