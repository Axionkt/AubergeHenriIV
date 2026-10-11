import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import { useAuth } from "../context/AuthContext";
import styles from "./Auth.module.css";
import { getApiError } from "../lib/apiError";
import Input from "../components/form/Input";
import { RULES } from "../lib/password";
import StrengthBar from "../components/form/StrengthBar";
import RuleList from "../components/form/RuleList";

export default function Register() {
  const { register, registerWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [gLoading, setGLoading] = useState(false);

  const allRulesPassed = useMemo(
    () => RULES.every((r) => r.test(form.password)),
    [form.password],
  );

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (name === "password") setPasswordTouched(true);
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!allRulesPassed) {
      setError("Le mot de passe ne respecte pas tous les critères requis.");
      return;
    }
    if (form.password !== form.confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await register(form.email, form.password, form.firstName, form.lastName);
      navigate("/verification-email", {
        replace: true,
        state: { email: form.email },
      });
    } catch (err: unknown) {
      setError(getApiError(err, "L'inscription a échoué. Veuillez réessayer."));
    } finally {
      setLoading(false);
    }
  }

  const handleGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGLoading(true);
      setError("");
      try {
        await registerWithGoogle(tokenResponse.access_token);
        navigate("/", { replace: true });
      } catch (err: unknown) {
        setError(
          getApiError(err, "Inscription Google échouée. Veuillez réessayer."),
        );
      } finally {
        setGLoading(false);
      }
    },
    onError: () => setError("Inscription Google annulée ou échouée."),
  });

  return (
    <div className={styles.page}>
      <div className={styles.panel}>
        <div className={styles.brandmark}>
          <span className={styles.brandResidence}>Auberge</span>
          <span className={styles.brandName}>Henri IV</span>
        </div>

        <div className={styles.card}>
          <h2 className={styles.title}>Créer un compte</h2>
          <p className={styles.sub}>
            Accédez à nos appartements en exclusivité
          </p>

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
            {gLoading ? "Inscription…" : "Continuer avec Google"}
          </button>

          <div className="divider-ornament" style={{ margin: "20px 0" }}>
            ou
          </div>

          <form onSubmit={handleSubmit} className={styles.form} noValidate>
            <div className={styles.nameRow}>
              <Input
                label="Prénom"
                name="firstName"
                type="text"
                value={form.firstName}
                onChange={handleChange}
                placeholder="Marie"
                required
                autoComplete="given-name"
              />
              <Input
                label="Nom"
                name="lastName"
                type="text"
                value={form.lastName}
                onChange={handleChange}
                placeholder="Dupont"
                required
                autoComplete="family-name"
              />
            </div>

            <Input
              label="Adresse e-mail"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="vous@exemple.com"
              required
              autoComplete="email"
            />

            <Input
              label="Mot de passe"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Créez un mot de passe fort"
              required
              autoComplete="new-password"
            />
            <StrengthBar password={form.password} />
            <RuleList password={form.password} touched={passwordTouched} />

            <Input
              label="Confirmer le mot de passe"
              name="confirm"
              type="password"
              value={form.confirm}
              onChange={handleChange}
              placeholder="••••••••"
              required
              autoComplete="new-password"
            />

            {error && <p className="msg-error">{error}</p>}

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%", marginTop: 4 }}
              disabled={loading || gLoading || !allRulesPassed || !form.confirm}
            >
              {loading ? "Création…" : "Créer mon compte"}
            </button>
          </form>

          <p className={styles.footer}>
            Déjà un compte ? <Link to="/connexion">Se connecter</Link>
          </p>
        </div>
      </div>

      <div className={styles.visual} />
    </div>
  );
}
