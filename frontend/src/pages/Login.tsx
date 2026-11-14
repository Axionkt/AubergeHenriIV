import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import GoogleAuthButton from "../components/GoogleAuthButton";
import { useAuth } from "../context/AuthContext";
import styles from "./Auth.module.css";
import { getApiErrorMessage, getApiStatus } from "../lib/apiError";
import Input from "../components/form/Input";

interface LocationState {
  from?: { pathname: string };
  verified?: boolean;
}

export default function Login() {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as LocationState)?.from?.pathname ?? null;

  const verified = (location.state as LocationState)?.verified ?? false;

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [gLoading, setGLoading] = useState(false);

  function redirect(isAdmin: boolean) {
    navigate(from ?? (isAdmin ? "/admin" : "/"), { replace: true });
  }
  const [unverified, setUnverified] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError("");
    setUnverified(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      redirect(user.isAdmin);
    } catch (err: unknown) {
      if (getApiStatus(err) === 403) {
        setUnverified(true);
      } else {
        setError(
          getApiErrorMessage(
            err,
            "Identifiants incorrects. Veuillez réessayer.",
          ),
        );
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle(idToken: string) {
    setGLoading(true);
    setError("");
    try {
      const user = await loginWithGoogle(idToken);
      redirect(user.isAdmin);
    } catch (err: unknown) {
      setError(
        getApiErrorMessage(err, "Connexion Google échouée. Veuillez réessayer."),
      );
    } finally {
      setGLoading(false);
    }
  }

  function handleGoogleError() {
    setError("Connexion Google annulée ou échouée.");
  }

  return (
    <div className={styles.page}>
      <div className={styles.panel}>
        <div className={styles.brandmark}>
          <span className={styles.brandResidence}>Auberge</span>
          <span className={styles.brandName}>Henri IV</span>
        </div>

        <div className={styles.card}>
          <h2 className={styles.title}>Bon retour</h2>
          <p className={styles.sub}>Connectez-vous à votre espace personnel</p>

          <GoogleAuthButton

            text="continue_with"

            loading={gLoading}

            loadingLabel="Connexion…"

            onCredential={handleGoogle}

            onError={handleGoogleError}

          />

          <div className="divider-ornament" style={{ margin: "20px 0" }}>
            ou
          </div>

          <form onSubmit={handleSubmit} className={styles.form} noValidate>
            <Input
              label="Adresse e-mail"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="vous@exemple.com"
              required
            />
            <Input
              label="Mot de passe"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />
            <Link
              to="/mot-de-passe-oublie"
              className={styles.forgotLink}
              tabIndex={-1}
            >
              Mot de passe oublié ?
            </Link>
            {verified && !error && (
              <p className="msg-success" style={{ marginBottom: 8 }}>
                ✓ Votre adresse e-mail a été vérifiée. Vous pouvez maintenant
                vous connecter.
              </p>
            )}
            {unverified && (
              <div className={styles.unverifiedBox}>
                <p>Votre adresse e-mail n'est pas encore vérifiée.</p>
                <Link
                  to="/verification-email"
                  state={{ email: form.email }}
                  className={styles.unverifiedLink}
                >
                  Renvoyer l'e-mail de confirmation →
                </Link>
              </div>
            )}
            {error && <p className="msg-error">{error}</p>}
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%", marginTop: 4 }}
              disabled={loading || gLoading}
            >
              {loading ? "Connexion…" : "Se connecter"}
            </button>
          </form>

          <p className={styles.footer}>
            Pas encore de compte ?{" "}
            <Link to="/inscription">Créer un compte</Link>
          </p>
        </div>
      </div>

      <div className={styles.visual} />
    </div>
  );
}
