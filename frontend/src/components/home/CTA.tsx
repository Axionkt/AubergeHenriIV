import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ConfirmModal from "../ConfirmModal";
import { useToast } from "../../context/ToastContext";
import styles from "./CTA.module.css";

const CONTACT_EMAIL = "aubergeh4@gmail.com";

export default function CTA({ isAuth }: { isAuth: boolean }) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [showModal, setShowModal] = useState(false);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL);
      return true;
    } catch {
      return false;
    }
  };

  const notifyCopied = () => {
    showToast(
      `Adresse copiée : ${CONTACT_EMAIL} — collez-la dans un e-mail pour nous écrire.`,
      "success",
    );
  };

  const handleContactClick = async () => {
    if (isAuth) {
      const ok = await copyEmail();
      if (ok) notifyCopied();
    } else {
      setShowModal(true);
    }
  };

  const handleDeny = async () => {
    const ok = await copyEmail();
    setShowModal(false);
    if (ok) notifyCopied();
  };

  return (
    <section className={styles.ctaSection}>
      <div className={styles.overlay} />
      <div className={styles.ctaContent}>
        <p className="section-eyebrow" style={{ color: "#ffffffb3" }}>
          Contactez-nous
        </p>
        <h2 className={styles.ctaTitle}>
          Envie d'en savoir plus sur
          <br />
          <em>l'expérience Henri IV ?</em>
        </h2>
        <button
          onClick={handleContactClick}
          className="btn btn-gold btn-lg"
          style={{ marginTop: 32 }}
        >
          Contactez-nous
        </button>
      </div>

      <ConfirmModal
        isOpen={showModal}
        variant="default"
        title="Créer un compte ?"
        message="Un compte est nécessaire pour bénéficier d'accès au contenu réservé. Vous pouvez en créer un dès maintenant, ou copier notre adresse et nous écrire sans compte."
        confirmLabel="Créer un compte"
        denyLabel={`Copier ${CONTACT_EMAIL}`}
        onConfirm={() => {
          setShowModal(false);
          navigate("/inscription");
        }}
        onDeny={handleDeny}
        onCancel={() => setShowModal(false)}
      />
    </section>
  );
}
