import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
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

  const handleGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGLoading(true);
      setError("");
      try {
        const user = await loginWithGoogle(tokenResponse.access_token);
        redirect(user.isAdmin);
      } catch (err: unknown) {
        setError(
          getApiErrorMessage(
            err,
            "Connexion Google échouée. Veuillez réessayer.",
          ),
        );
      } finally {
        setGLoading(false);
      }
    },
    onError: () => {
      setError("Connexion Google annulée ou échouée.");
    },
  });

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

          <button
            className={styles.googleBtn}
            onClick={() => handleGoogle()}
            disabled={gLoading || loading}
          >
            {gLoading ? (
              <span className={styles.googleSpinner} />
            ) : (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path
                  d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
                  fill="#4285F4"
                />
                <path
                  d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
                  fill="#34A853"
                />
                <path
                  d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
                  fill="#FBBC05"
                />
                <path
                  d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
                  fill="#EA4335"
                />
              </svg>
            )}
            {gLoading ? "Connexion…" : "Continuer avec Google"}
          </button>

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
