/* eslint-disable prettier/prettier */
export function buildForgotPasswordEmail(
  name: string,
  newPassword: string,
): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Réinitialisation du mot de passe</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0"
          style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

          <!-- Header rouge -->
          <tr>
            <td style="background-color:#CC1F1F;padding:24px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;letter-spacing:1px;">
                W<sup style="font-size:14px;">+</sup> DocGen
              </h1>
              <p style="margin:4px 0 0;color:#f8d7d7;font-size:12px;">
                Plateforme de gestion de documentation API
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="font-size:16px;color:#333333;margin:0 0 12px;">
                Bonjour <strong>${name}</strong>,
              </p>
              <p style="font-size:15px;color:#555555;margin:0 0 24px;line-height:1.6;">
                Vous avez demandé la réinitialisation de votre mot de passe.
                Voici votre nouveau mot de passe temporaire :
              </p>

              <!-- Mot de passe encadré -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td align="center">
                    <div style="
                      display:inline-block;
                      background-color:#fff5f5;
                      border:2px dashed #CC1F1F;
                      border-radius:8px;
                      padding:16px 40px;
                      font-size:22px;
                      font-weight:bold;
                      color:#CC1F1F;
                      letter-spacing:4px;
                    ">
                      ${newPassword}
                    </div>
                  </td>
                </tr>
              </table>

              <p style="font-size:14px;color:#888888;margin:0 0 24px;line-height:1.6;">
                ⚠️ Pour des raisons de sécurité, nous vous recommandons de changer ce mot de passe
                dès votre prochaine connexion via la section <em>"Changer le mot de passe"</em>.
              </p>

              <!-- Bouton Se connecter -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="#"
                      style="
                        display:inline-block;
                        background-color:#CC1F1F;
                        color:#ffffff;
                        text-decoration:none;
                        padding:14px 40px;
                        border-radius:6px;
                        font-size:15px;
                        font-weight:bold;
                      ">
                      Se connecter à DocGen
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f9f9f9;padding:20px 40px;text-align:center;border-top:1px solid #eeeeee;">
              <p style="margin:0;font-size:12px;color:#aaaaaa;">
                Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.
              </p>
              <p style="margin:6px 0 0;font-size:12px;color:#aaaaaa;">
                © 2024 Warning+ · DocGen · Tous droits réservés
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
