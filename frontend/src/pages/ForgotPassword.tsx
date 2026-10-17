import { useState } from "react";
import { Link } from "react-router-dom";
import styles from "./Auth.module.css";
import { getApiErrorMessage } from "../lib/apiError";
import Input from "../components/form/Input";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, _hp: honeypot }),
      });
      setSubmitted(true);
    } catch (err: unknown) {
      setError(
        getApiErrorMessage(err, "Une erreur est survenue. Veuillez réessayer."),
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
          <h2 className={styles.title}>Mot de passe oublié</h2>
          <p className={styles.sub}>
            Entrez votre adresse e-mail pour recevoir un lien de
            réinitialisation.
          </p>

          {submitted ? (
            <p className="msg-success">
              Si un compte existe avec cette adresse, vous recevrez un e-mail
              dans quelques minutes.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className={styles.form} noValidate>
              <div style={{ display: "none" }} aria-hidden="true">
                <input
                  type="text"
                  name="_hp"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                />
              </div>

              <Input
                label="Adresse e-mail"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.com"
                required
              />

              {error && <p className="msg-error">{error}</p>}

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: "100%", marginTop: 4 }}
                disabled={loading}
              >
                {loading ? "Envoi…" : "Envoyer le lien"}
              </button>
            </form>
          )}

          <p className={styles.footer}>
            <Link to="/connexion">← Retour à la connexion</Link>
          </p>
        </div>
      </div>

      <div className={styles.visual} />
    </div>
  );
}
