import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail(
  email: string,
  firstName: string,
  token: string,
) {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
  return resend.emails.send({
    from: "no-reply@auberge-henri4.com",
    to: email,
    subject: "Vérifiez votre adresse e-mail — Auberge Henri IV",
    html: verificationEmailHtml({ firstName, verificationUrl }),
  });
}

interface VerificationEmailParams {
  firstName: string;
  verificationUrl: string;
}

function verificationEmailHtml({
  firstName,
  verificationUrl,
}: VerificationEmailParams): string {
  return `<!DOCTYPE html>
  <html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vérifiez votre adresse e-mail</title>
  </head>
  <body style="margin:0;padding:0;background-color:#F4F1EC;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  
    <!-- Wrapper -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F4F1EC;padding:40px 16px;">
      <tr>
        <td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
  
            <!-- Header -->
            <tr>
              <td align="center" style="padding-bottom:28px;">
                <p style="margin:0;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#8C7E66;">
                  Auberge
                </p>
                <p style="margin:4px 0 0;font-family:Georgia,serif;font-size:26px;font-weight:400;color:#4A3B6B;letter-spacing:0.01em;">
                  Henri IV
                </p>
              </td>
            </tr>
  
            <!-- Card -->
            <tr>
              <td style="background-color:#ffffff;border-radius:16px;border:1px solid #DDD5C4;overflow:hidden;box-shadow:0 4px 18px rgba(30,26,20,0.10);">
  
                <!-- Top accent bar -->
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="height:4px;background:linear-gradient(90deg,#4A3B6B 0%,#C4963A 100%);"></td>
                  </tr>
                </table>
  
                <!-- Body -->
                <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 40px 32px;">
  
                  <!-- Icon -->
                  <tr>
                    <td align="center" style="padding-bottom:24px;">
                      <div style="display:inline-block;width:56px;height:56px;background-color:#EAE6F5;border-radius:50%;text-align:center;line-height:56px;font-size:24px;">
                        ✉
                      </div>
                    </td>
                  </tr>
  
                  <!-- Greeting -->
                  <tr>
                    <td>
                      <p style="margin:0 0 8px;font-family:Georgia,serif;font-size:26px;font-weight:400;color:#1E1A14;text-align:center;">
                        Bonjour, ${firstName} !
                      </p>
                      <p style="margin:0 0 24px;font-size:15px;color:#5C5040;text-align:center;line-height:1.6;">
                        Merci de rejoindre l'Auberge Henri IV.<br/>
                        Confirmez votre adresse e-mail pour activer votre compte.
                      </p>
                    </td>
                  </tr>
  
                  <!-- Divider -->
                  <tr>
                    <td style="padding-bottom:24px;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="height:1px;background-color:#DDD5C4;"></td>
                        </tr>
                      </table>
                    </td>
                  </tr>
  
                  <!-- CTA Button -->
                  <tr>
                    <td align="center" style="padding-bottom:24px;">
                      <a href="${verificationUrl}"
                        style="display:inline-block;padding:14px 36px;background-color:#4A3B6B;color:#ffffff;font-size:14px;font-weight:500;letter-spacing:0.05em;text-decoration:none;border-radius:8px;">
                        Vérifier mon adresse e-mail
                      </a>
                    </td>
                  </tr>
  
                  <!-- Fallback link -->
                  <tr>
                    <td>
                      <p style="margin:0 0 6px;font-size:12px;color:#8C7E66;text-align:center;">
                        Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :
                      </p>
                      <p style="margin:0;font-size:11px;color:#4A3B6B;text-align:center;word-break:break-all;">
                        ${verificationUrl}
                      </p>
                    </td>
                  </tr>
  
                  <!-- Divider -->
                  <tr>
                    <td style="padding:24px 0 0;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="height:1px;background-color:#DDD5C4;"></td>
                        </tr>
                      </table>
                    </td>
                  </tr>
  
                  <!-- Expiry note -->
                  <tr>
                    <td style="padding-top:20px;">
                      <p style="margin:0;font-size:12px;color:#8C7E66;text-align:center;line-height:1.6;">
                        Ce lien est valable pendant <strong>24 heures</strong>.<br/>
                        Si vous n'avez pas créé de compte, ignorez simplement cet e-mail.
                      </p>
                    </td>
                  </tr>
  
                </table>
              </td>
            </tr>
  
            <!-- Footer -->
            <tr>
              <td align="center" style="padding-top:28px;">
                <p style="margin:0 0 6px;font-family:Georgia,serif;font-size:14px;color:#C4963A;">
                  Auberge Henri IV
                </p>
                <p style="margin:0;font-size:11px;color:#BEB49C;font-style:italic;">
                  L'art de vivre palois
                </p>
                <p style="margin:12px 0 0;font-size:11px;color:#BEB49C;">
                  © ${new Date().getFullYear()} Auberge Henri IV · Pau, France
                </p>
              </td>
            </tr>
  
          </table>
        </td>
      </tr>
    </table>
  
  </body>
  </html>`;
}

export async function sendPasswordResetEmail(
  email: string,
  firstName: string,
  token: string,
) {
  const resetUrl = `${process.env.FRONTEND_URL}/reinitialisation-mot-de-passe?token=${token}`;
  return resend.emails.send({
    from: "no-reply@auberge-henri4.com",
    to: email,
    subject: "Réinitialisation de votre mot de passe — Auberge Henri IV",
    html: passwordResetEmailHtml({ firstName, resetUrl }),
  });
}

interface PasswordResetEmailParams {
  firstName: string;
  resetUrl: string;
}

function passwordResetEmailHtml({
  firstName,
  resetUrl,
}: PasswordResetEmailParams): string {
  return `<!DOCTYPE html>
  <html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Réinitialisation de mot de passe</title>
  </head>
  <body style="margin:0;padding:0;background-color:#F4F1EC;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F4F1EC;padding:40px 16px;">
      <tr>
        <td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
            <tr>
              <td align="center" style="padding-bottom:28px;">
                <p style="margin:0;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#8C7E66;">Auberge</p>
                <p style="margin:4px 0 0;font-family:Georgia,serif;font-size:26px;font-weight:400;color:#4A3B6B;letter-spacing:0.01em;">Henri IV</p>
              </td>
            </tr>
            <tr>
              <td style="background-color:#ffffff;border-radius:16px;border:1px solid #DDD5C4;overflow:hidden;box-shadow:0 4px 18px rgba(30,26,20,0.10);">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr><td style="height:4px;background:linear-gradient(90deg,#4A3B6B 0%,#C4963A 100%);"></td></tr>
                </table>
                <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 40px 32px;">
                  <tr>
                    <td align="center" style="padding-bottom:24px;">
                      <div style="display:inline-block;width:56px;height:56px;background-color:#EAE6F5;border-radius:50%;text-align:center;line-height:56px;font-size:24px;">🔑</div>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <p style="margin:0 0 8px;font-family:Georgia,serif;font-size:26px;font-weight:400;color:#1E1A14;text-align:center;">Bonjour, ${firstName} !</p>
                      <p style="margin:0 0 24px;font-size:15px;color:#5C5040;text-align:center;line-height:1.6;">
                        Vous avez demandé à réinitialiser votre mot de passe.<br/>
                        Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-bottom:24px;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr><td style="height:1px;background-color:#DDD5C4;"></td></tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding-bottom:24px;">
                      <a href="${resetUrl}" style="display:inline-block;padding:14px 36px;background-color:#4A3B6B;color:#ffffff;font-size:14px;font-weight:500;letter-spacing:0.05em;text-decoration:none;border-radius:8px;">
                        Réinitialiser mon mot de passe
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <p style="margin:0 0 6px;font-size:12px;color:#8C7E66;text-align:center;">Si le bouton ne fonctionne pas, copiez ce lien :</p>
                      <p style="margin:0;font-size:11px;color:#4A3B6B;text-align:center;word-break:break-all;">${resetUrl}</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:24px 0 0;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr><td style="height:1px;background-color:#DDD5C4;"></td></tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-top:20px;">
                      <p style="margin:0;font-size:12px;color:#8C7E66;text-align:center;line-height:1.6;">
                        Ce lien est valable pendant <strong>1 heure</strong>.<br/>
                        Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding-top:28px;">
                <p style="margin:0 0 6px;font-family:Georgia,serif;font-size:14px;color:#C4963A;">Auberge Henri IV</p>
                <p style="margin:0;font-size:11px;color:#BEB49C;font-style:italic;">L'art de vivre palois</p>
                <p style="margin:12px 0 0;font-size:11px;color:#BEB49C;">© ${new Date().getFullYear()} Auberge Henri IV · Pau, France</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>`;
}

export async function sendApartmentAccessGrantedEmail(
  users: { email: string; firstName: string }[],
  apartments: { id: string; name: string }[],
) {
  console.log(
    "sendApartmentAccessGrantedEmail called with users:",
    users,
    "and apartments:",
    apartments,
  );
  return resend.batch.send(
    users.map(({ email, firstName }) => ({
      from: "no-reply@auberge-henri4.com",
      to: email,
      subject:
        apartments.length > 1
          ? "Accès accordé à de nouveaux appartements — Auberge Henri IV"
          : "Accès accordé à un appartement — Auberge Henri IV",
      html: apartmentAccessGrantedEmailHtml({ firstName, apartments }),
    })),
  );
}

interface ApartmentAccessGrantedEmailParams {
  firstName: string;
  apartments: { id: string; name: string }[];
}

function apartmentAccessGrantedEmailHtml({
  firstName,
  apartments,
}: ApartmentAccessGrantedEmailParams): string {
  const collectionUrl = `${process.env.FRONTEND_URL}/?tab=appartements#collection`;

  const apartmentRows = apartments
    .map(
      (apt, i) => `
                  <tr>
                    <td style="padding:${i === 0 ? "0" : "12px"} 0 0;">
                      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F4F1EC;border:1px solid #DDD5C4;border-radius:10px;">
                        <tr>
                          <td style="padding:16px 20px;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                              <tr>
                                <td style="font-family:Georgia,serif;font-size:17px;color:#1E1A14;">
                                  ${apt.name}
                                </td>
                                <td align="right">
                                  <a href="${process.env.FRONTEND_URL}/appartements/${apt.id}"
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
                  </tr>`,
    )
    .join("");

  const introText =
    apartments.length > 1
      ? "Vous avez désormais accès aux appartements suivants :"
      : "Vous avez désormais accès à l'appartement suivant :";

  return `<!DOCTYPE html>
  <html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Accès accordé</title>
  </head>
  <body style="margin:0;padding:0;background-color:#F4F1EC;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F4F1EC;padding:40px 16px;">
      <tr>
        <td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
            <tr>
              <td align="center" style="padding-bottom:28px;">
                <p style="margin:0;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#8C7E66;">Auberge</p>
                <p style="margin:4px 0 0;font-family:Georgia,serif;font-size:26px;font-weight:400;color:#4A3B6B;letter-spacing:0.01em;">Henri IV</p>
              </td>
            </tr>
            <tr>
              <td style="background-color:#ffffff;border-radius:16px;border:1px solid #DDD5C4;overflow:hidden;box-shadow:0 4px 18px rgba(30,26,20,0.10);">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr><td style="height:4px;background:linear-gradient(90deg,#4A3B6B 0%,#C4963A 100%);"></td></tr>
                </table>
                <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 40px 32px;">
                  <tr>
                    <td align="center" style="padding-bottom:24px;">
                      <div style="display:inline-block;width:56px;height:56px;background-color:#F7F0DC;border-radius:50%;text-align:center;line-height:56px;font-size:24px;">🔑</div>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <p style="margin:0 0 8px;font-family:Georgia,serif;font-size:26px;font-weight:400;color:#1E1A14;text-align:center;">Bonjour, ${firstName} !</p>
                      <p style="margin:0 0 24px;font-size:15px;color:#5C5040;text-align:center;line-height:1.6;">
                        ${introText}
                      </p>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding-bottom:24px;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        ${apartmentRows}
                      </table>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding-bottom:24px;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr><td style="height:1px;background-color:#DDD5C4;"></td></tr>
                      </table>
                    </td>
                  </tr>

                  <tr>
                    <td align="center" style="padding-bottom:12px;">
                      <a href="${collectionUrl}"
                        style="display:inline-block;padding:14px 36px;background-color:#4A3B6B;color:#ffffff;font-size:14px;font-weight:500;letter-spacing:0.05em;text-decoration:none;border-radius:8px;">
                        Voir tous les appartements
                      </a>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:24px 0 0;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr><td style="height:1px;background-color:#DDD5C4;"></td></tr>
                      </table>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding-top:20px;">
                      <p style="margin:0;font-size:12px;color:#8C7E66;text-align:center;line-height:1.6;">
                        Retrouvez vos accès à tout moment depuis votre espace personnel.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding-top:28px;">
                <p style="margin:0 0 6px;font-family:Georgia,serif;font-size:14px;color:#C4963A;">Auberge Henri IV</p>
                <p style="margin:0;font-size:11px;color:#BEB49C;font-style:italic;">L'art de vivre palois</p>
                <p style="margin:12px 0 0;font-size:11px;color:#BEB49C;">© ${new Date().getFullYear()} Auberge Henri IV · Pau, France</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>`;
}
