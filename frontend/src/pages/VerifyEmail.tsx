import { Await, useLoaderData, useNavigate, Link } from "react-router-dom";
import { Suspense, useEffect } from "react";
import styles from "./Auth.module.css";

function VerifyEmailSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(
      () => navigate("/connexion", { state: { verified: true } }),
      5000,
    );
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <>
      <div className={`${styles.verifyIcon} ${styles.verifyIconSuccess}`}>
        ✓
      </div>
      <h2 className={styles.title}>E-mail vérifié !</h2>
      <p className={styles.sub}>
        Votre compte est maintenant actif. Vous allez être redirigé vers la
        connexion…
      </p>
      <Link to="/connexion" className={`btn btn-primary ${styles.resendBtn}`}>
        Se connecter maintenant
      </Link>
    </>
  );
}

function VerifyEmailPending() {
  return (
    <>
      <div className={styles.verifyIcon}>
        <span className={styles.verifySpinner} />
      </div>
      <h2 className={styles.title}>Vérification…</h2>
      <p className={styles.sub}>Validation de votre adresse e-mail en cours.</p>
    </>
  );
}

function VerifyEmailErrorInline() {
  return (
    <>
      <div className={`${styles.verifyIcon} ${styles.verifyIconError}`}>✗</div>
      <h2 className={styles.title}>Lien invalide</h2>
      <p className={styles.sub}>Le lien est invalide ou a expiré.</p>
      <Link to="/connexion" className={`btn btn-outline ${styles.resendBtn}`}>
        Retour à la connexion
      </Link>
    </>
  );
}

export default function VerifyEmail() {
  const { verification } = useLoaderData() as {
    verification: Promise<unknown>;
  };

  return (
    <div className={styles.page}>
      <div className={styles.panel}>
        <div className={styles.brandmark}>
          <span className={styles.brandResidence}>Auberge</span>
          <span className={styles.brandName}>Henri IV</span>
        </div>
        <div className={styles.card}>
          <Suspense fallback={<VerifyEmailPending />}>
            <Await
              resolve={verification}
              errorElement={<VerifyEmailErrorInline />}
            >
              <VerifyEmailSuccess />
            </Await>
          </Suspense>
        </div>
      </div>
      <div className={styles.visual} />
    </div>
  );
}
