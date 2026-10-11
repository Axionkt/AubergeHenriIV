import { forwardRef, useId } from "react";
import styles from "./Input.module.css";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, id, required, disabled, className, ...rest }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const msgId = `${inputId}-msg`;

    return (
      <div className={styles.root}>
        {label && (
          <label htmlFor={inputId} className={styles.label}>
            {label}
            {required && (
              <span className={styles.required} aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}

        <input
          ref={ref}
          id={inputId}
          required={required}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={error ? msgId : undefined}
          aria-required={required}
          className={[styles.input, error ? styles.error : "", className ?? ""]
            .join(" ")
            .trim()}
          {...rest}
        />

        {error ? (
          <span id={msgId} role="alert" className={styles.errorMsg}>
            <ErrorIcon />
            {error}
          </span>
        ) : hint ? (
          <span className={styles.hint}>{hint}</span>
        ) : null}
      </div>
    );
  },
);

Input.displayName = "Input";
export default Input;

function ErrorIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <circle cx="8" cy="8" r="7" stroke="#9b2335" strokeWidth="1.4" />
      <line
        x1="8"
        y1="4.5"
        x2="8"
        y2="8.8"
        stroke="#9b2335"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <circle cx="8" cy="11" r="0.8" fill="#9b2335" />
    </svg>
  );
}
