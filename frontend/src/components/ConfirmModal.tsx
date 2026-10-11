import { useEffect } from "react";
import styles from "./ConfirmModal.module.css";

interface Props {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  denyLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "default";
  onConfirm: () => void;
  onDeny?: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = "Confirmer",
  denyLabel,
  cancelLabel = "Annuler",
  variant = "danger",
  onConfirm,
  onDeny,
  onCancel,
}: Props) {
  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onCancel]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const icon = variant === "danger" ? "⚠" : variant === "warning" ? "!" : "?";

  return (
    <div
      className={styles.backdrop}
      onClick={onCancel}
      aria-modal="true"
      role="dialog"
    >
      <div
        className={`${styles.modal} ${styles[variant]}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.iconWrap}>
          <span className={styles.icon}>{icon}</span>
        </div>

        <h3>{title}</h3>
        <p className={styles.message}>{message}</p>

        <div className={styles.actions}>
          {onDeny ? (
            <button
              className={`btn btn-outline ${styles.cancelBtn}`}
              onClick={onDeny}
            >
              {denyLabel}
            </button>
          ) : (
            <button
              className={`btn btn-outline ${styles.cancelBtn}`}
              onClick={onCancel}
            >
              {cancelLabel}
            </button>
          )}
          <button
            className={`btn ${variant === "danger" ? "btn-danger" : "btn-primary"} ${styles.confirmBtn}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
