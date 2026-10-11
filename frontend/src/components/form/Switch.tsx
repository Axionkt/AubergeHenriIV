import { forwardRef, useId } from "react";
import styles from "./Switch.module.css";

interface SwitchProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  label?: string;
  hint?: string;
  error?: string;
}

const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ label, hint, error, id, required, disabled, className, ...rest }, ref) => {
    const generatedId = useId();
    const switchId = id ?? generatedId;
    const msgId = `${switchId}-msg`;

    const trackClass = [
      styles.track,
      error ? styles.trackError : "",
      disabled ? styles.trackDisabled : "",
    ]
      .join(" ")
      .trim();

    return (
      <div className={styles.root}>
        <label
          htmlFor={switchId}
          className={[styles.row, disabled ? styles.disabled : ""]
            .join(" ")
            .trim()}
        >
          <input
            ref={ref}
            type="checkbox"
            role="switch"
            id={switchId}
            required={required}
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={error ? msgId : undefined}
            aria-required={required}
            className={[styles.hiddenInput, className ?? ""].join(" ").trim()}
            {...rest}
          />

          <span className={trackClass} aria-hidden="true">
            <span className={styles.thumb} />
          </span>

          {label && (
            <span
              className={[styles.labelText, error ? styles.labelError : ""]
                .join(" ")
                .trim()}
            >
              {label}
              {required && (
                <span className={styles.required} aria-hidden="true">
                  *
                </span>
              )}
            </span>
          )}
        </label>

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

Switch.displayName = "Switch";
export default Switch;

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
