import { useRouteError, Link } from "react-router-dom";
import styles from "./Auth.module.css";
import { getApiError } from "../lib/apiError";

export default function VerifyEmailError() {
  const error = useRouteError();
  const msg =
    error instanceof Response
      ? "Lien invalide ou manquant."
      : getApiError(error, "Le lien est invalide ou a expiré.");

  return (
    <div className={styles.page}>
      <div className={styles.panel}>
        <div className={styles.brandmark}>
          <span className={styles.brandResidence}>Auberge</span>
          <span className={styles.brandName}>Henri IV</span>
        </div>
        <div className={styles.card}>
          <div className={`${styles.verifyIcon} ${styles.verifyIconError}`}>
            ✗
          </div>
          <h2 className={styles.title}>Lien invalide</h2>
          <p className={styles.sub}>{msg}</p>
          <Link
            to="/connexion"
            className={`btn btn-outline ${styles.resendBtn}`}
          >
            Retour à la connexion
          </Link>
        </div>
      </div>
      <div className={styles.visual} />
    </div>
  );
}
