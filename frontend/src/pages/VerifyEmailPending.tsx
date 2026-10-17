import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../lib/axios";
import styles from "./Auth.module.css";
import { getApiErrorMessage } from "../lib/apiError";

// The register route passes the email via location state
interface LocationState {
  email?: string;
}

export default function VerifyEmailPending() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = (location.state as LocationState)?.email ?? "";

  const [resending, setResending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleResend() {
    setResending(true);
    setSent(false);
    setError("");
    try {
      await api.post("/auth/resend-verification", { email: email });
      setSent(true);
    } catch (err: unknown) {
      setError(
        getApiErrorMessage(err, "Une erreur est survenue. Veuillez réessayer."),
      );
    } finally {
      setResending(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.panel} style={{ gap: 0 }}>
        <div className={styles.brandmark}>
          <span className={styles.brandResidence}>Auberge</span>
          <span className={styles.brandName}>Henri IV</span>
        </div>

        <div className={styles.card}>
          <div className={styles.verifyIcon}>✉</div>

          <h2 className={`${styles.title} ${styles.verifyTitle}`}>
            Vérifiez votre e-mail
          </h2>
          <p className={styles.verifySub}>
            Un lien de confirmation a été envoyé à
          </p>
          {email && <p className={styles.verifyEmail}>{email}</p>}
          <p className={styles.verifyHint}>
            Cliquez sur le lien dans l'e-mail pour activer votre compte.
            Vérifiez également vos spams si vous ne le trouvez pas.
          </p>

          <div className={styles.dividerThin} />

          <p className={styles.resendText}>Vous n'avez pas reçu l'e-mail ?</p>

          {sent && (
            <p className="msg-success" style={{ marginBottom: 12 }}>
              E-mail renvoyé avec succès.
            </p>
          )}
          {error && (
            <p className="msg-error" style={{ marginBottom: 12 }}>
              {error}
            </p>
          )}

          <button
            className={`btn btn-outline ${styles.resendBtn}`}
            onClick={handleResend}
            disabled={resending}
          >
            {resending
              ? "Envoi en cours…"
              : "Renvoyer l'e-mail de confirmation"}
          </button>

          <button
            className={`btn btn-ghost btn-sm ${styles.backBtn}`}
            onClick={() => navigate("/connexion")}
          >
            ← Retour à la connexion
          </button>
        </div>
      </div>

      <div className={styles.visual} />
    </div>
  );
}
