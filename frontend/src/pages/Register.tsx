import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import GoogleAuthButton from "../components/GoogleAuthButton";
import { useAuth } from "../context/AuthContext";
import styles from "./Auth.module.css";
import { getApiErrorMessage } from "../lib/apiError";
import Input from "../components/form/Input";
import { RULES } from "../lib/password";
import { googleErrorMessage } from "../lib/googleAuth";
import StrengthBar from "../components/form/StrengthBar";
import RuleList from "../components/form/RuleList";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [error, setError] = useState(() =>
    googleErrorMessage(searchParams.get("erreur")),
  );

  // The Google error was read into state above: drop it from the URL so a
  // refresh doesn't show it again.
  useEffect(() => {
    if (!searchParams.has("erreur")) return;
    const next = new URLSearchParams(searchParams);
    next.delete("erreur");
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const [loading, setLoading] = useState(false);

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
      setError(
        getApiErrorMessage(err, "L'inscription a échoué. Veuillez réessayer."),
      );
    } finally {
      setLoading(false);
    }
  }

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

          <GoogleAuthButton intent="register" />

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
              disabled={loading || !allRulesPassed || !form.confirm}
            >
              {loading ? "Création…" : "Créer mon compte"}
            </button>
          </form>

          <p className={styles.privacyNote}>
            Vos données servent uniquement à gérer votre compte. Voir notre{" "}
            <Link to="/confidentialite">politique de confidentialité</Link>.
          </p>

          <p className={styles.footer}>
            Déjà un compte ? <Link to="/connexion">Se connecter</Link>
          </p>
        </div>
      </div>

      <div className={styles.visual} />
    </div>
  );
}
