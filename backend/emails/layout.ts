import { escapeHtml } from "./escapeHtml";

interface RenderLayoutParams {
  icon: string;
  title: string;
  bodyHtml: string;
}

export function renderLayout({
  icon,
  title,
  bodyHtml,
}: RenderLayoutParams): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background-color:#F4F1EC;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
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
                      ${escapeHtml(icon)}
                    </div>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td>
                    ${bodyHtml}
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
