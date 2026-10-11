import rateLimit, { ipKeyGenerator } from "express-rate-limit";

// User ID when authenticated, otherwise the client IP (IPv6-safe)
const keyGenerator = (req: any) =>
  req.user?.sub ?? ipKeyGenerator(req.ip ?? "unknown");

// Normalized email from the request body, falling back to the client IP.
// req.body is undefined in Express 5 when a request has no body, and the
// value is unvalidated user input at this point, so check its type.
const emailKeyGenerator = (req: any) => {
  const email = req.body?.email;
  return typeof email === "string" && email.trim() !== ""
    ? email.trim().toLowerCase()
    : ipKeyGenerator(req.ip ?? "unknown");
};

// Global rate limiter for all requests except media (media has its own
// limiter below, which would otherwise never be reached)
export const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 150,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path.startsWith("/media/"),
  message: { error: "Trop de requêtes. Veuillez réessayer plus tard." },
});

// Auth route specific limiters
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Trop de tentatives d'inscription, veuillez réessayer plus tard.",
  },
});
export const verifyEmailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error:
      "Trop de tentatives de vérification, veuillez demander un nouveau lien.",
  },
});
export const resendVerificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 3,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: emailKeyGenerator,
  message: {
    error:
      "Trop de emails de vérification demandés, veuillez réessayer plus tard.",
  },
});
export const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 3,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: emailKeyGenerator,
  message: {
    error:
      "Trop de requêtes de réinitialisation de mot de passe, veuillez réessayer plus tard.",
  },
});
export const resetPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error:
      "Trop de tentatives de réinitialisation, veuillez demander un nouveau lien.",
  },
});
export const loginLimiter = rateLimit({
  windowMs: 30 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // only count failed attempts
  message: {
    error:
      "Trop de tentatives de connexion, veuillez réessayer dans 30 minutes.",
  },
});
export const oauthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 15,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  message: {
    error:
      "Trop de tentatives d'authentification, veuillez réessayer dans un moment.",
  },
});
export const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) =>
    req.decodedRefreshToken?.sub ?? ipKeyGenerator(req.ip ?? "unknown"),
  message: {
    error:
      "Trop de tentatives de rafraîchissement, veuillez vous connecter à nouveau.",
  },
});

// Media route specific limiters
export const mediaFetchLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Trop de requêtes de média, veuillez ralentir." },
});

// Browsing rate limiters
export const browseLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 90,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  message: { error: "Trop de requêtes, veuillez ralentir." },
});

// User name change limiter
export const mutateAccountLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 3,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  message: {
    error:
      "Trop de tentatives de mise à jour de profil, veuillez réessayer plus tard.",
  },
});

// Admin route specific limiters
export const adminMediaMutationLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  message: { error: "Trop de requêtes de média, veuillez ralentir." },
});
