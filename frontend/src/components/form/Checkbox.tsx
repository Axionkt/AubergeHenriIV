import { forwardRef, useId, useEffect, useRef } from "react";
import styles from "./Checkbox.module.css";

interface CheckboxProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  label?: string;
  hint?: string;
  error?: string;
  indeterminate?: boolean;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      label,
      hint,
      error,
      id,
      required,
      disabled,
      indeterminate,
      className,
      ...rest
    },
    ref,
  ) => {
    const generatedId = useId();
    const checkboxId = id ?? generatedId;
    const msgId = `${checkboxId}-msg`;

    const innerRef = useRef<HTMLInputElement>(null);
    const resolvedRef = (ref as React.RefObject<HTMLInputElement>) ?? innerRef;

    useEffect(() => {
      if (resolvedRef.current) {
        resolvedRef.current.indeterminate = indeterminate ?? false;
      }
    }, [indeterminate, resolvedRef]);

    const boxClass = [
      styles.box,
      error ? styles.boxError : "",
      disabled ? styles.boxDisabled : "",
      indeterminate ? styles.boxIndeterminate : "",
    ]
      .join(" ")
      .trim();

    return (
      <div className={styles.root}>
        <label
          htmlFor={checkboxId}
          className={[styles.row, disabled ? styles.disabled : ""]
            .join(" ")
            .trim()}
        >
          <input
            ref={resolvedRef}
            type="checkbox"
            id={checkboxId}
            required={required}
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={error ? msgId : undefined}
            aria-required={required}
            aria-checked={indeterminate ? "mixed" : undefined}
            className={[styles.hiddenInput, className ?? ""].join(" ").trim()}
            {...rest}
          />

          <span className={boxClass} aria-hidden="true">
            {indeterminate ? <DashIcon /> : <CheckIcon />}
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

Checkbox.displayName = "Checkbox";
export default Checkbox;

function CheckIcon() {
  return (
    <svg
      width="11"
      height="9"
      viewBox="0 0 11 9"
      fill="none"
      aria-hidden="true"
    >
      <polyline
        points="1.5,4.5 4,7 9.5,1.5"
        stroke="#fff"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DashIcon() {
  return (
    <svg
      width="10"
      height="2"
      viewBox="0 0 10 2"
      fill="none"
      aria-hidden="true"
    >
      <line
        x1="1"
        y1="1"
        x2="9"
        y2="1"
        stroke="#fff"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

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
