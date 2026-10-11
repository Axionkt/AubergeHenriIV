import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import styles from "./ToastContext.module.css";

export type ToastVariant = "success" | "error" | "info" | "warning";

interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
  duration: number;
  leaving?: boolean;
}

interface ToastContextValue {
  showToast: (
    message: string,
    variant?: ToastVariant,
    duration?: number,
  ) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const ICONS: Record<ToastVariant, string> = {
  success: "✓",
  error: "✕",
  info: "ⓘ",
  warning: "!",
};

const EXIT_DURATION = 220;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)),
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, EXIT_DURATION);
  }, []);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = "info", duration = 3500) => {
      const id = nextId.current++;
      setToasts((prev) => [...prev, { id, message, variant, duration }]);
      setTimeout(() => removeToast(id), duration);
    },
    [removeToast],
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className={styles.container} aria-live="polite" aria-atomic="true">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`${styles.toast} ${styles[t.variant]} ${
              t.leaving ? styles.leaving : ""
            }`}
          >
            <span className={styles.icon} aria-hidden="true">
              {ICONS[t.variant]}
            </span>
            <span className={styles.message}>{t.message}</span>
            <button
              type="button"
              className={styles.closeBtn}
              onClick={() => removeToast(t.id)}
              aria-label="Fermer"
            >
              x
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}
