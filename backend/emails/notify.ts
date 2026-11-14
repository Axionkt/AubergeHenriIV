import { config } from "../config";
import { logError } from "../utils/logger";
import { sendEmail, sendEmailBatch } from "./mailer";
import {
  renderAccessGrantedEmail,
  renderPasswordResetEmail,
  renderVerificationEmail,
  type AccessGrantedResource,
} from "./templates";

const FROM_EMAIL = "no-reply@auberge-henri4.com";

const FRONTEND_URL = config.FRONTEND_URL.replace(/\/+$/, "");

interface AccessGrantedUser {
  email: string;
  firstName: string;
}

interface AccessGrantedInputResource {
  id: string;
  name: string;
}

type AccessGrantedKind = "apartment" | "proSpace";

interface AccessGrantedConfig {
  singularSubject: string;
  pluralSubject: string;
  singularIntro: string;
  pluralIntro: string;
  buttonText: string;
  collectionPath: string;
  resourcePath: (id: string) => string;
}

const ACCESS_GRANTED_CONFIG: Record<AccessGrantedKind, AccessGrantedConfig> = {
  apartment: {
    singularSubject: "un logement",
    pluralSubject: "de nouveaux logements",
    singularIntro: "au logement suivant",
    pluralIntro: "aux logements suivants",
    buttonText: "Voir mes logements",
    collectionPath: "/appartements",
    resourcePath: (id) => `/appartements/${encodeURIComponent(id)}`,
  },

  proSpace: {
    singularSubject: "un espace professionnel",
    pluralSubject: "de nouveaux espaces professionnels",
    singularIntro: "à l'espace professionnel suivant",
    pluralIntro: "aux espaces professionnels suivants",
    buttonText: "Voir mes espaces professionnels",
    collectionPath: "/espaces-pro",
    resourcePath: (id) => `/espaces-pro/${encodeURIComponent(id)}`,
  },
};

function getFrontendUrl(path: string): string {
  return `${FRONTEND_URL}${path}`;
}

export async function sendVerificationEmail(
  email: string,
  firstName: string,
  token: string,
): Promise<void> {
  const verificationUrl = getFrontendUrl(
    `/verify-email?token=${encodeURIComponent(token)}`,
  );

  await sendEmail({
    from: FROM_EMAIL,
    to: email,
    subject: "Vérifiez votre adresse e-mail — Auberge Henri IV",
    html: renderVerificationEmail({
      firstName,
      verificationUrl,
    }),
  });
}

export async function sendPasswordResetEmail(
  email: string,
  firstName: string,
  token: string,
): Promise<void> {
  const resetUrl = getFrontendUrl(
    `/reinitialisation-mot-de-passe?token=${encodeURIComponent(token)}`,
  );

  await sendEmail({
    from: FROM_EMAIL,
    to: email,
    subject: "Réinitialisation de votre mot de passe — Auberge Henri IV",
    html: renderPasswordResetEmail({
      firstName,
      resetUrl,
    }),
  });
}

export async function notifyAccessGranted(
  kind: AccessGrantedKind,
  users: AccessGrantedUser[],
  resources: AccessGrantedInputResource[],
): Promise<void> {
  if (users.length === 0 || resources.length === 0) return;

  const emailConfig = ACCESS_GRANTED_CONFIG[kind];
  const multipleResources = resources.length > 1;

  const subject = multipleResources
    ? `Accès accordé à ${emailConfig.pluralSubject} — Auberge Henri IV`
    : `Accès accordé à ${emailConfig.singularSubject} — Auberge Henri IV`;

  const introText = multipleResources
    ? `Vous avez désormais accès ${emailConfig.pluralIntro} :`
    : `Vous avez désormais accès ${emailConfig.singularIntro} :`;

  const collectionUrl = getFrontendUrl(emailConfig.collectionPath);

  const emailResources: AccessGrantedResource[] = resources.map((resource) => ({
    id: resource.id,
    name: resource.name,
    url: getFrontendUrl(emailConfig.resourcePath(resource.id)),
  }));

  const BATCH_SIZE = 100;

  for (let i = 0; i < users.length; i += BATCH_SIZE) {
    const batch = users.slice(i, i + BATCH_SIZE);

    try {
      await sendEmailBatch(
        batch.map(({ email, firstName }) => ({
          from: FROM_EMAIL,
          to: email,
          subject,
          html: renderAccessGrantedEmail({
            firstName,
            resources: emailResources,
            introText,
            collectionUrl,
            buttonText: emailConfig.buttonText,
          }),
        })),
      );
    } catch (error) {
      logError(error, {
        forceServerError: true,
        operation: "notifyAccessGranted",
      });
    }
  }
}
