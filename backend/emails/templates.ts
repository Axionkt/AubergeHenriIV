import { escapeHtml } from "./escapeHtml";
import { renderLayout } from "./layout";

interface VerificationEmailParams {
  firstName: string;
  verificationUrl: string;
}

export function renderVerificationEmail({
  firstName,
  verificationUrl,
}: VerificationEmailParams): string {
  const safeUrl = escapeHtml(verificationUrl);

  const bodyHtml = `
    <p style="margin:0 0 8px;font-family:Georgia,serif;font-size:26px;font-weight:400;color:#1E1A14;text-align:center;">
      Bonjour, ${escapeHtml(firstName)} !
    </p>

    <p style="margin:0 0 24px;font-size:15px;color:#5C5040;text-align:center;line-height:1.6;">
      Merci de rejoindre l'Auberge Henri IV.<br/>
      Confirmez votre adresse e-mail pour activer votre compte.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding-bottom:24px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="height:1px;background-color:#DDD5C4;"></td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding-bottom:24px;">
          <a href="${safeUrl}"
            style="display:inline-block;padding:14px 36px;background-color:#4A3B6B;color:#ffffff;font-size:14px;font-weight:500;letter-spacing:0.05em;text-decoration:none;border-radius:8px;">
            Vérifier mon adresse e-mail
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 6px;font-size:12px;color:#8C7E66;text-align:center;">
      Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :
    </p>

    <p style="margin:0;font-size:11px;color:#4A3B6B;text-align:center;word-break:break-all;">
      ${safeUrl}
    </p>

    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding:24px 0 0;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="height:1px;background-color:#DDD5C4;"></td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <p style="margin:0;padding-top:20px;font-size:12px;color:#8C7E66;text-align:center;line-height:1.6;">
      Ce lien est valable pendant <strong>24 heures</strong>.<br/>
      Si vous n'avez pas créé de compte, ignorez simplement cet e-mail.
    </p>
  `;

  return renderLayout({
    icon: "✉",
    title: "Vérifiez votre adresse e-mail",
    bodyHtml,
  });
}

interface PasswordResetEmailParams {
  firstName: string;
  resetUrl: string;
}

export function renderPasswordResetEmail({
  firstName,
  resetUrl,
}: PasswordResetEmailParams): string {
  const safeUrl = escapeHtml(resetUrl);

  const bodyHtml = `
    <p style="margin:0 0 8px;font-family:Georgia,serif;font-size:26px;font-weight:400;color:#1E1A14;text-align:center;">
      Bonjour, ${escapeHtml(firstName)} !
    </p>

    <p style="margin:0 0 24px;font-size:15px;color:#5C5040;text-align:center;line-height:1.6;">
      Vous avez demandé à réinitialiser votre mot de passe.<br/>
      Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding-bottom:24px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="height:1px;background-color:#DDD5C4;"></td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding-bottom:24px;">
          <a href="${safeUrl}"
            style="display:inline-block;padding:14px 36px;background-color:#4A3B6B;color:#ffffff;font-size:14px;font-weight:500;letter-spacing:0.05em;text-decoration:none;border-radius:8px;">
            Réinitialiser mon mot de passe
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 6px;font-size:12px;color:#8C7E66;text-align:center;">
      Si le bouton ne fonctionne pas, copiez ce lien :
    </p>

    <p style="margin:0;font-size:11px;color:#4A3B6B;text-align:center;word-break:break-all;">
      ${safeUrl}
    </p>

    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding:24px 0 0;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="height:1px;background-color:#DDD5C4;"></td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <p style="margin:0;padding-top:20px;font-size:12px;color:#8C7E66;text-align:center;line-height:1.6;">
      Ce lien est valable pendant <strong>1 heure</strong>.<br/>
      Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.
    </p>
  `;

  return renderLayout({
    icon: "🔑",
    title: "Réinitialisation de mot de passe",
    bodyHtml,
  });
}

export interface AccessGrantedResource {
  id: string;
  name: string;
  url: string;
}

interface AccessGrantedEmailParams {
  firstName: string;
  resources: AccessGrantedResource[];
  introText: string;
  collectionUrl: string;
  buttonText: string;
}

export function renderAccessGrantedEmail({
  firstName,
  resources,
  introText,
  collectionUrl,
  buttonText,
}: AccessGrantedEmailParams): string {
  const resourceRows = resources
    .map(
      (resource, index) => `
        <tr>
          <td style="padding:${index === 0 ? "0" : "12px"} 0 0;">
            <table width="100%" cellpadding="0" cellspacing="0"
              style="background-color:#F4F1EC;border:1px solid #DDD5C4;border-radius:10px;">
              <tr>
                <td style="padding:16px 20px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="font-family:Georgia,serif;font-size:17px;color:#1E1A14;">
                        ${escapeHtml(resource.name)}
                      </td>
                      <td align="right">
                        <a href="${escapeHtml(resource.url)}"
                          style="font-size:13px;font-weight:500;color:#4A3B6B;text-decoration:none;white-space:nowrap;">
                          Voir →
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `,
    )
    .join("");

  const bodyHtml = `
    <p style="margin:0 0 8px;font-family:Georgia,serif;font-size:26px;font-weight:400;color:#1E1A14;text-align:center;">
      Bonjour, ${escapeHtml(firstName)} !
    </p>

    <p style="margin:0 0 24px;font-size:15px;color:#5C5040;text-align:center;line-height:1.6;">
      ${introText}
    </p>

    <table width="100%" cellpadding="0" cellspacing="0">
      ${resourceRows}
    </table>

    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding-bottom:24px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="height:1px;background-color:#DDD5C4;"></td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding-bottom:12px;">
          <a href="${escapeHtml(collectionUrl)}"
            style="display:inline-block;padding:14px 36px;background-color:#4A3B6B;color:#ffffff;font-size:14px;font-weight:500;letter-spacing:0.05em;text-decoration:none;border-radius:8px;">
            ${escapeHtml(buttonText)}
          </a>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding:24px 0 0;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="height:1px;background-color:#DDD5C4;"></td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <p style="margin:0;padding-top:20px;font-size:12px;color:#8C7E66;text-align:center;line-height:1.6;">
      Retrouvez vos accès à tout moment depuis votre espace personnel.
    </p>
  `;

  return renderLayout({
    icon: "🔑",
    title: "Accès accordé",
    bodyHtml,
  });
}
