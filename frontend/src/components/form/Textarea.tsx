import { forwardRef, useId, useState } from "react";
import styles from "./Textarea.module.css";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      hint,
      error,
      id,
      required,
      disabled,
      maxLength,
      defaultValue,
      value,
      onChange,
      className,
      ...rest
    },
    ref,
  ) => {
    const generatedId = useId();
    const textareaId = id ?? generatedId;
    const msgId = `${textareaId}-msg`;

    const [charCount, setCharCount] = useState(
      () => String(value ?? defaultValue ?? "").length,
    );

    const nearLimit = maxLength !== undefined && charCount >= maxLength * 0.8;
    const atLimit = maxLength !== undefined && charCount >= maxLength;

    const counterClass = [
      styles.counter,
      atLimit ? styles.limit : nearLimit ? styles.near : "",
    ]
      .join(" ")
      .trim();

    const hasLabelRow = label || maxLength !== undefined;

    return (
      <div className={styles.root}>
        {hasLabelRow && (
          <div className={styles.labelRow}>
            {label ? (
              <label htmlFor={textareaId} className={styles.label}>
                {label}
                {required && (
                  <span className={styles.required} aria-hidden="true">
                    *
                  </span>
                )}
              </label>
            ) : (
              <span />
            )}
            {maxLength !== undefined && (
              <span className={counterClass} aria-live="polite">
                {charCount} / {maxLength}
              </span>
            )}
          </div>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          required={required}
          disabled={disabled}
          maxLength={maxLength}
          value={value}
          defaultValue={defaultValue}
          aria-invalid={!!error}
          aria-describedby={error ? msgId : undefined}
          aria-required={required}
          className={[
            styles.textarea,
            error ? styles.error : "",
            className ?? "",
          ]
            .join(" ")
            .trim()}
          onChange={(e) => {
            setCharCount(e.currentTarget.value.length);
            onChange?.(e);
          }}
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

Textarea.displayName = "Textarea";
export default Textarea;

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
