import Router from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { authenticationMiddleware } from "../middleware/authenticationMiddleware";
import AuthService from "../services/AuthService";
import {
  browseLimiter,
  forgotPasswordLimiter,
  loginLimiter,
  oauthLimiter,
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
  validateGoogleAuthRequest,
} from "../schemas/auth";
import { assertValid } from "../utils/validation";
import { clearAuthCookies, setAuthCookies } from "../utils/authCookies";
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
  "/google/register",
  oauthLimiter,
  asyncHandler(async (req, res) => {
    const result = assertValid(validateGoogleAuthRequest(req.body));

    const profile = await AuthService.getGoogleProfile(result.googleToken);
    const { user, tokenVersion } = await AuthService.registerGoogle(profile);

    setAuthCookies(res, { id: user.id, isAdmin: user.isAdmin, tokenVersion });
    res.status(201).json(user);
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

router.post(
  "/google/login",
  oauthLimiter,
  asyncHandler(async (req, res) => {
    const result = assertValid(validateGoogleAuthRequest(req.body));

    const profile = await AuthService.getGoogleProfile(result.googleToken);
    const { user, tokenVersion } = await AuthService.verifyCredentialsGoogle(
      profile.email,
    );

    setAuthCookies(res, { id: user.id, isAdmin: user.isAdmin, tokenVersion });
    res.status(200).json(user);
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
