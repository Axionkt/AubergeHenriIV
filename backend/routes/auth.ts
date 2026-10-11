import Router from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { generateAccessToken, generateRefreshToken } from "../utils/password";
import { UnauthorizedError } from "../utils/errors/UnauthorizedError";
import { authMiddleware } from "../middleware/authMiddleware";
import UserManagement from "../services/UserManagement";
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
} from "../rateLimiting";
import { refreshTokenMiddleware } from "../middleware/refreshTokenMiddleware";
import UserServices from "../services/UserServices";
import {
  validateRegisterRequest,
  validateVerifyEmailQuery,
  validateResendVerificationRequest,
  validateForgotPasswordRequest,
  validateResetPasswordRequest,
  validateLoginRequest,
  validateGoogleAuthRequest,
} from "../schemas/auth";
import { assertValid } from "../utils/validation";

const router = Router();

router.post(
  "/register",
  registerLimiter,
  asyncHandler(async (req, res) => {
    const result = assertValid(validateRegisterRequest(req.body));

    await UserManagement.register(result);

    res.status(201).json({ message: "Email de vérification envoyé." });
  }),
);

router.get(
  "/verify-email",
  verifyEmailLimiter,
  asyncHandler(async (req, res) => {
    const result = assertValid(validateVerifyEmailQuery(req.query));

    await UserManagement.verifyEmailRegistration(result.token);

    res.status(200).json({ message: "Adresse e-mail vérifiée avec succès." });
  }),
);

router.post(
  "/resend-verification",
  resendVerificationLimiter,
  asyncHandler(async (req, res) => {
    const result = assertValid(validateResendVerificationRequest(req.body));

    await UserManagement.updateUserEmailVerificationStatus(result.email);

    res.status(200).json({ message: "Email de vérification renvoyé." });
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

    await UserManagement.requestPasswordReset(result.email);
    res.status(200).json({ message: "E-mail envoyé si le compte existe." });
  }),
);

router.post(
  "/reset-password",
  resetPasswordLimiter,
  asyncHandler(async (req, res) => {
    const result = assertValid(validateResetPasswordRequest(req.body));

    await UserManagement.resetPassword(result.token, result.password);
    res.status(200).json({ message: "Mot de passe réinitialisé." });
  }),
);

router.post(
  "/google/register",
  oauthLimiter,
  asyncHandler(async (req, res) => {
    const result = assertValid(validateGoogleAuthRequest(req.body));

    const googleRes = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      { headers: { Authorization: `Bearer ${result.googleToken}` } },
    );

    if (!googleRes.ok) throw new UnauthorizedError("Token Google invalide.");

    const googleUser = (await googleRes.json()) as {
      sub: string;
      email: string;
      given_name: string;
      family_name: string;
      email_verified: boolean;
    };

    if (!googleUser.email_verified) {
      throw new UnauthorizedError(
        "L'adresse e-mail du compte Google n'est pas vérifiée.",
      );
    }

    const newUser = await UserManagement.registerGoogle({
      email: googleUser.email,
      firstName: googleUser.given_name,
      lastName: googleUser.family_name,
    });

    const accessToken = generateAccessToken(newUser.id, newUser.isAdmin);
    const refreshToken = generateRefreshToken(newUser.id);

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 15 * 60 * 1000,
    });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/api/auth/refresh",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.status(201).json(newUser);
  }),
);

router.post(
  "/login",
  loginLimiter,
  asyncHandler(async (req, res) => {
    const result = assertValid(validateLoginRequest(req.body));

    const user = await UserManagement.verifyCredentials(
      result.email,
      result.password,
    );

    const accessToken = generateAccessToken(user.id, user.isAdmin);
    const refreshToken = generateRefreshToken(user.id);

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 15 * 60 * 1000,
    });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/api/auth/refresh",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.status(200).json(user);
  }),
);

router.post(
  "/google/login",
  oauthLimiter,
  asyncHandler(async (req, res) => {
    const result = assertValid(validateGoogleAuthRequest(req.body));

    const googleRes = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      { headers: { Authorization: `Bearer ${result.googleToken}` } },
    );

    if (!googleRes.ok) throw new UnauthorizedError("Token Google invalide.");

    const googleUser = (await googleRes.json()) as {
      sub: string;
      email: string;
      given_name: string;
      family_name: string;
      email_verified: boolean;
    };

    if (!googleUser.email_verified) {
      throw new UnauthorizedError(
        "L'adresse e-mail du compte Google n'est pas vérifiée.",
      );
    }

    const user = await UserManagement.verifyCredentialsGoogle(googleUser.email);

    const accessToken = generateAccessToken(user.id, user.isAdmin);
    const refreshToken = generateRefreshToken(user.id);

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 15 * 60 * 1000,
    });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/api/auth/refresh",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.status(200).json(user);
  }),
);

router.post(
  "/refresh",
  refreshTokenMiddleware,
  refreshLimiter,
  asyncHandler(async (req, res) => {
    const user = await UserManagement.initializeUserSession(
      req.decodedRefreshToken!.sub,
    );

    const accessToken = generateAccessToken(user.id, user.is_admin);
    const newRefreshToken = generateRefreshToken(user.id);

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 15 * 60 * 1000,
    });
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/api/auth/refresh",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.sendStatus(200);
  }),
);

router.post(
  "/logout",
  asyncHandler(async (req, res) => {
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.sendStatus(204);
  }),
);

router.get(
  "/me",
  authMiddleware,
  browseLimiter,
  asyncHandler(async (req, res) => {
    const user = await UserServices.getUserById(req.user!.sub);

    res.status(200).json(user);
  }),
);

export default router;
