/** Messages for the ?erreur= codes the Google callback redirects with. */
const GOOGLE_ERRORS: Record<string, string> = {
  cancelled: "Connexion Google annulée.",
  expired: "La connexion Google a expiré. Veuillez réessayer.",
  failed: "La connexion Google a échoué. Veuillez réessayer.",
  unverified: "L'adresse e-mail de ce compte Google n'est pas vérifiée.",
  exists: "Un compte existe déjà avec cette adresse. Connectez-vous plutôt.",
  not_found:
    "Aucun compte Google n'est associé à cette adresse. Créez un compte, ou connectez-vous avec votre mot de passe.",
  rate_limited:
    "Trop de tentatives d'authentification. Veuillez réessayer dans un moment.",
};

export function googleErrorMessage(code: string | null): string {
  if (!code) return "";
  return GOOGLE_ERRORS[code] ?? GOOGLE_ERRORS.failed;
}
