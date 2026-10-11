import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import styles from "./Auth.module.css";
import { getApiError } from "../lib/apiError";
import api from "../lib/axios";
import Input from "../components/form/Input";
import StrengthBar from "../components/form/StrengthBar";
import RuleList from "../components/form/RuleList";
import { RULES } from "../lib/password";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const allRulesPassed = useMemo(
    () => RULES.every((r) => r.test(password)),
    [password],
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!allRulesPassed) {
      setError("Le mot de passe ne respecte pas tous les critères requis.");
      return;
    }
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await api.post("/auth/reset-password", { token, password });
      setDone(true);
    } catch (err: unknown) {
      setError(getApiError(err, "Lien invalide ou expiré."));
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className={styles.page}>
        <div className={styles.panel}>
          <div className={styles.card}>
            <p className="msg-error">Lien de réinitialisation invalide.</p>
            <p className={styles.footer}>
              <Link to="/mot-de-passe-oublie">Faire une nouvelle demande</Link>
            </p>
          </div>
        </div>
        <div className={styles.visual} />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.panel}>
        <div className={styles.brandmark}>
          <span className={styles.brandResidence}>Auberge</span>
          <span className={styles.brandName}>Henri IV</span>
        </div>

        <div className={styles.card}>
          <h2 className={styles.title}>Nouveau mot de passe</h2>
          <p className={styles.sub}>Choisissez un mot de passe sécurisé.</p>

          {done ? (
            <>
              <p className="msg-success">
                Mot de passe mis à jour avec succès !
              </p>
              <p className={styles.footer}>
                <Link to="/connexion">Se connecter →</Link>
              </p>
            </>
          ) : (
            <form onSubmit={handleSubmit} className={styles.form} noValidate>
              <Input
                label="Nouveau mot de passe"
                name="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordTouched(true);
                  setError("");
                }}
                placeholder="••••••••"
                required
                autoComplete="new-password"
              />
              <StrengthBar password={password} />
              <RuleList password={password} touched={passwordTouched} />

              <Input
                label="Confirmer le mot de passe"
                name="confirm"
                type="password"
                value={confirm}
                onChange={(e) => {
                  setConfirm(e.target.value);
                  setError("");
                }}
                placeholder="••••••••"
                required
                autoComplete="new-password"
              />

              {error && <p className="msg-error">{error}</p>}

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: "100%", marginTop: 4 }}
                disabled={loading}
              >
                {loading ? "Enregistrement…" : "Enregistrer le mot de passe"}
              </button>
            </form>
          )}
        </div>
      </div>

      <div className={styles.visual} />
    </div>
  );
}
